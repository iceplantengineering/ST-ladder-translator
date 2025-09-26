from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import os
import re
from datetime import datetime

class ConversionRequest(BaseModel):
    source_code: str
    plc_type: str = "mitsubishi"
    options: Optional[dict] = {}

class ConversionResponse(BaseModel):
    success: bool
    ladder_data: dict
    device_map: dict
    errors: List[str]
    warnings: List[str]
    processing_time: float

app = FastAPI(title="ST to Ladder Converter", version="2.0.0")

@app.get("/")
async def root():
    return {"message": "ST to Ladder Converter API is running", "status": "healthy"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://st-ladder-translator.netlify.app"  # Netlify production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimpleLadderConverter:
    def __init__(self):
        self.device_counters = {
            'X': 0,  # Input devices
            'Y': 0,  # Output devices
            'M': 0,  # Internal relays
            'D': 0,  # Data registers
            'T': 0,  # Timers
            'C': 0   # Counters
        }
        self.variable_map = {}  # Map variable names to device addresses
        self.errors = []
        self.warnings = []

    def convert(self, source_code: str, plc_type: str = "mitsubishi") -> tuple:
        self.device_counters = {k: 0 for k in self.device_counters}
        self.variable_map = {}
        self.errors = []
        self.warnings = []

        ladder_data = {
            'rungs': [],
            'metadata': {
                'plc_type': plc_type,
                'generated_at': datetime.now().isoformat()
            }
        }

        device_map = {
            'inputs': {},
            'outputs': {},
            'internals': {},
            'timers': {},
            'counters': {}
        }

        # Preprocess: remove comments and handle multi-line structures
        cleaned_code = self._preprocess_code(source_code)
        lines = cleaned_code.strip().split('\n')

        # Parse line by line with support for complex structures
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue

            try:
                # Skip unsupported structures (with warnings)
                if line.startswith('TYPE') or line.startswith('STRUCT') or line.startswith('FUNCTION_BLOCK') or line.startswith('PROGRAM'):
                    structure_type = line.split()[0]
                    end_line = self._find_structure_end(lines, i, structure_type)
                    if end_line:
                        self.warnings.append(f"Skipping unsupported {structure_type} structure (lines {i+1}-{end_line+1})")
                        i = end_line + 1
                        continue

                # Parse variable declarations (including VAR_GLOBAL)
                elif ':' in line and ('VAR' in line or 'VAR_INPUT' in line or 'VAR_OUTPUT' in line or 'VAR_GLOBAL' in line):
                    self._parse_variable_declaration(line)

                # Parse IF statements
                elif line.startswith('IF'):
                    rungs = self._parse_if_statement(line, lines[i:])
                    for rung in rungs:
                        ladder_data['rungs'].append(rung)

                # Parse CASE statements (convert to IF-ELSE)
                elif line.startswith('CASE'):
                    rungs = self._parse_case_statement(line, lines[i:])
                    for rung in rungs:
                        ladder_data['rungs'].append(rung)

                # Parse simple assignments
                elif ':=' in line:
                    rungs = self._parse_assignment(line)
                    for rung in rungs:
                        ladder_data['rungs'].append(rung)

                i += 1

            except Exception as e:
                self.errors.append(f"Error parsing line {i+1}: '{line}' - {str(e)}")
                i += 1

        return ladder_data, device_map

    def _parse_variable_declaration(self, line: str):
        # Enhanced variable parsing to handle complex declarations
        line = line.strip()

        # Handle different variable types
        if 'BOOL' in line:
            # Extract variable name(s) - handle multiple variables per line
            var_pattern = r'(\w+)\s*:\s*BOOL'
            matches = re.findall(var_pattern, line)

            for var_name in matches:
                if var_name not in self.variable_map:
                    if var_name.startswith('X') or any(keyword in var_name.lower() for keyword in ['input', 'sensor', 'button', 'start', 'stop', 'emergency']):
                        self.variable_map[var_name] = f'X{self.device_counters["X"]}'
                        self.device_counters["X"] += 1
                    elif var_name.startswith('Y') or any(keyword in var_name.lower() for keyword in ['motor', 'lamp', 'valve', 'output', 'alarm', 'buzzer']):
                        self.variable_map[var_name] = f'Y{self.device_counters["Y"]}'
                        self.device_counters["Y"] += 1
                    else:
                        self.variable_map[var_name] = f'M{self.device_counters["M"]}'
                        self.device_counters["M"] += 1

        elif 'DINT' in line:
            # Handle DINT variables (map to data registers)
            var_pattern = r'(\w+)\s*:\s*DINT'
            matches = re.findall(var_pattern, line)

            for var_name in matches:
                if var_name not in self.variable_map:
                    self.variable_map[var_name] = f'D{self.device_counters["D"]}'
                    self.device_counters["D"] += 1

        elif 'REAL' in line:
            # Handle REAL variables (map to data registers)
            var_pattern = r'(\w+)\s*:\s*REAL'
            matches = re.findall(var_pattern, line)

            for var_name in matches:
                if var_name not in self.variable_map:
                    self.variable_map[var_name] = f'D{self.device_counters["D"]}'
                    self.device_counters["D"] += 1

        elif 'TIME' in line:
            # Handle TIME variables (map to timers)
            var_pattern = r'(\w+)\s*:\s*TIME'
            matches = re.findall(var_pattern, line)

            for var_name in matches:
                if var_name not in self.variable_map:
                    self.variable_map[var_name] = f'T{self.device_counters["T"]}'
                    self.device_counters["T"] += 1

    def _parse_if_statement(self, if_line: str, lines: List[str]) -> List[dict]:
        # Extract condition from IF line
        condition_match = re.search(r'IF\s+(.+?)\s+THEN', if_line, re.IGNORECASE)
        if not condition_match:
            return []

        condition = condition_match.group(1).strip()

        # Find the corresponding END_IF or next statement
        then_block = []
        found_if_line = False

        for i, line in enumerate(lines):
            stripped_line = line.strip()

            if not found_if_line:
                if stripped_line.startswith('IF'):
                    # Extract assignments from the same line as IF
                    if 'THEN' in stripped_line:
                        after_then = stripped_line.split('THEN', 1)[1].strip()
                        if after_then and not after_then.startswith('END_IF'):
                            # Split multiple assignments
                            assignments = [part.strip() for part in after_then.split(';') if part.strip()]
                            for assignment in assignments:
                                if ':=' in assignment:
                                    then_block.append(assignment.rstrip(';'))
                    found_if_line = True
                continue

            # Check for end of IF block
            if stripped_line.startswith('END_IF') or stripped_line.startswith('END_IF;'):
                break
            elif stripped_line.startswith('IF') or stripped_line.startswith('ELSIF') or stripped_line.startswith('ELSE'):
                break
            elif stripped_line and not stripped_line.startswith('//'):
                # Extract assignments from then block
                if ':=' in stripped_line:
                    # Split multiple assignments on the same line
                    assignments = [part.strip() for part in stripped_line.split(';') if part.strip()]
                    for assignment in assignments:
                        if ':=' in assignment:
                            then_block.append(assignment.rstrip(';'))

        if not then_block:
            return []

        # Parse the condition to extract individual variables
        condition_vars = self._parse_condition_variables(condition)

        # Create separate rungs for each output
        rungs = []

        for assignment in then_block:
            if ':=' in assignment:
                var_name = assignment.split(':')[0].strip()
                value = assignment.split(':')[1].strip()

                # Map variable to device address
                if var_name in self.variable_map:
                    device_addr = self.variable_map[var_name]
                else:
                    if var_name.startswith('Y') or 'Motor' in var_name or 'Lamp' in var_name or 'Valve' in var_name:
                        device_addr = f'Y{self.device_counters["Y"]}'
                        self.device_counters["Y"] += 1
                    else:
                        device_addr = f'M{self.device_counters["M"]}'
                        self.device_counters["M"] += 1
                    self.variable_map[var_name] = device_addr

                # Create a new rung with all condition variables
                rung_elements = []

                # Add condition contacts
                for i, cond_var in enumerate(condition_vars):
                    if cond_var in self.variable_map:
                        contact_addr = self.variable_map[cond_var]
                    else:
                        contact_addr = f'X{self.device_counters["X"]}'
                        self.variable_map[cond_var] = contact_addr
                        self.device_counters["X"] += 1

                    rung_elements.append({
                        'type': 'contact',
                        'address': contact_addr,
                        'description': cond_var,
                        'isNormallyOpen': True,
                        'x': 40 + i * 80,
                        'y': 30
                    })

                # Add output coil
                rung_elements.append({
                    'type': 'coil',
                    'address': device_addr,
                    'description': f'{var_name} := {value}',
                    'x': 40 + len(condition_vars) * 80,
                    'y': 30
                })

                rungs.append({'elements': rung_elements})

        return rungs

    def _parse_condition_variables(self, condition: str) -> List[str]:
        """Parse condition string to extract individual variables"""
        variables = []

        # Split by AND first
        and_parts = [part.strip() for part in condition.split('AND')]

        for part in and_parts:
            # Handle OR conditions within AND parts
            if ' OR ' in part:
                or_parts = [p.strip() for p in part.split('OR')]
                for or_part in or_parts:
                    # Clean up the variable name
                    var = or_part.replace('(', '').replace(')', '').replace('NOT', '').strip()
                    if var:
                        variables.append(var)
            else:
                # Clean up the variable name
                var = part.replace('(', '').replace(')', '').replace('NOT', '').strip()
                if var:
                    variables.append(var)

        return variables

    def _preprocess_code(self, source_code: str) -> str:
        """Remove comments and normalize code"""
        lines = source_code.split('\n')
        cleaned_lines = []

        for line in lines:
            # Remove inline comments
            if '(*' in line and '*)' in line:
                line = re.sub(r'\(\*.*?\*\)', '', line)
            elif line.startswith('(*'):
                continue
            elif line.strip().startswith('//'):
                continue

            # Clean up Japanese comments (remove text after certain patterns)
            line = re.sub(r'[^\w\s\(\)\[\]\{\}:;=\.\+\-\*/%<>&|!\',"]', '', line)
            cleaned_lines.append(line)

        return '\n'.join(cleaned_lines)

    def _find_structure_end(self, lines: List[str], start_idx: int, structure_type: str) -> Optional[int]:
        """Find the end line of a structure (TYPE, STRUCT, FUNCTION_BLOCK, PROGRAM)"""
        end_keywords = {
            'TYPE': 'END_TYPE',
            'STRUCT': 'END_STRUCT',
            'FUNCTION_BLOCK': 'END_FUNCTION_BLOCK',
            'PROGRAM': 'END_PROGRAM'
        }

        end_keyword = end_keywords.get(structure_type)
        if not end_keyword:
            return None

        for i in range(start_idx + 1, len(lines)):
            if end_keyword in lines[i]:
                return i
        return None

    def _parse_case_statement(self, case_line: str, lines: List[str]) -> List[dict]:
        """Convert CASE statement to multiple IF statements"""
        # Extract variable from CASE line
        case_match = re.search(r'CASE\s+(\w+)\s+OF', case_line, re.IGNORECASE)
        if not case_match:
            return []

        case_var = case_match.group(1)
        rungs = []

        # Find CASE blocks and convert to IF statements
        i = 0
        while i < len(lines):
            line = lines[i].strip()

            if line.startswith('END_CASE'):
                break

            # Look for case values (e.g., "0:", "1:", etc.)
            case_value_match = re.search(r'(\d+)\s*:', line)
            if case_value_match:
                case_value = case_value_match.group(1)

                # Create IF statement equivalent
                if_condition = f"IF {case_var} = {case_value} THEN"

                # Find statements in this case block
                case_statements = []
                j = i + 1
                while j < len(lines) and not lines[j].strip().startswith(('END_CASE', str(int(case_value) + 1) + ':')):
                    stmt = lines[j].strip()
                    if stmt and not stmt.startswith('//'):
                        case_statements.append(stmt)
                    j += 1

                # Convert to IF statement format
                if case_statements:
                    if_line = if_condition
                    for stmt in case_statements:
                        if ':=' in stmt:
                            if_line += f" {stmt.rstrip(';')};"

                    # Parse as IF statement
                    temp_lines = [if_line, "END_IF"]
                    case_rungs = self._parse_if_statement(if_line, temp_lines)
                    rungs.extend(case_rungs)

                i = j - 1  # Continue from where we left off

            i += 1

        return rungs

    def _parse_assignment(self, line: str) -> List[dict]:
        """Parse simple assignment statements"""
        if ':=' not in line:
            return []

        parts = line.split(':=')
        if len(parts) != 2:
            return []

        var_name = parts[0].strip()
        value = parts[1].strip().rstrip(';')

        # Map variable to device address
        if var_name in self.variable_map:
            device_addr = self.variable_map[var_name]
        else:
            if var_name.startswith('Y') or 'Motor' in var_name or 'Lamp' in var_name or 'Valve' in var_name:
                device_addr = f'Y{self.device_counters["Y"]}'
                self.device_counters["Y"] += 1
            else:
                device_addr = f'M{self.device_counters["M"]}'
                self.device_counters["M"] += 1
            self.variable_map[var_name] = device_addr

        # Create a simple rung with the assignment
        rung_elements = [{
            'type': 'coil',
            'address': device_addr,
            'description': f'{var_name} := {value}',
            'x': 40,
            'y': 30
        }]

        return [{'elements': rung_elements}]

@app.post("/api/convert", response_model=ConversionResponse)
async def convert_code(request: ConversionRequest):
    start_time = datetime.now()

    try:
        converter = SimpleLadderConverter()
        ladder_data, device_map = converter.convert(request.source_code, request.plc_type)

        # Update device map with variable mappings
        for var_name, device_addr in converter.variable_map.items():
            if device_addr.startswith('X'):
                device_map['inputs'][device_addr] = var_name
            elif device_addr.startswith('Y'):
                device_map['outputs'][device_addr] = var_name
            elif device_addr.startswith('M'):
                device_map['internals'][device_addr] = var_name

        processing_time = (datetime.now() - start_time).total_seconds()

        # Determine success based on whether we have any rungs or critical errors
        has_critical_errors = any("critical" in error.lower() for error in converter.errors)
        success = len(ladder_data['rungs']) > 0 or not has_critical_errors

        return ConversionResponse(
            success=success,
            ladder_data=ladder_data,
            device_map=device_map,
            errors=converter.errors,
            warnings=converter.warnings,
            processing_time=processing_time
        )

    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds()
        return ConversionResponse(
            success=False,
            ladder_data={'rungs': [], 'metadata': {'plc_type': request.plc_type, 'generated_at': datetime.now().isoformat()}},
            device_map={'inputs': {}, 'outputs': {}, 'internals': {}, 'timers': {}, 'counters': {}},
            errors=[f"Critical error: {str(e)}"],
            warnings=[],
            processing_time=processing_time
        )

@app.post("/api/upload-convert")
async def upload_and_convert(file: UploadFile = File(...)):
    try:
        content = await file.read()
        source_code = content.decode('utf-8')

        request = ConversionRequest(source_code=source_code)
        return await convert_code(request)

    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"detail": f"Error processing file: {str(e)}"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)