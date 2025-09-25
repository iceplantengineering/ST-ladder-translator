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

    def convert(self, source_code: str, plc_type: str = "mitsubishi") -> tuple:
        self.device_counters = {k: 0 for k in self.device_counters}
        self.variable_map = {}

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

        lines = source_code.strip().split('\n')

        for line in lines:
            line = line.strip()
            if not line or line.startswith('//') or line.startswith('(*'):
                continue

            # Parse variable declarations
            if ':' in line and ('VAR' in line or 'VAR_INPUT' in line or 'VAR_OUTPUT' in line):
                self._parse_variable_declaration(line)

            # Parse IF statements
            elif line.startswith('IF'):
                rungs = self._parse_if_statement(line, lines)
                for rung in rungs:
                    ladder_data['rungs'].append(rung)

        return ladder_data, device_map

    def _parse_variable_declaration(self, line: str):
        # Simple variable parsing
        if 'BOOL' in line:
            match = re.search(r'(\w+)\s*:\s*BOOL', line)
            if match:
                var_name = match.group(1)
                if var_name not in self.variable_map:
                    if var_name.startswith('X') or 'Input' in var_name or 'Sensor' in var_name or 'Button' in var_name:
                        self.variable_map[var_name] = f'X{self.device_counters["X"]}'
                        self.device_counters["X"] += 1
                    elif var_name.startswith('Y') or 'Motor' in var_name or 'Lamp' in var_name or 'Valve' in var_name:
                        self.variable_map[var_name] = f'Y{self.device_counters["Y"]}'
                        self.device_counters["Y"] += 1
                    else:
                        self.variable_map[var_name] = f'M{self.device_counters["M"]}'
                        self.device_counters["M"] += 1

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

        return ConversionResponse(
            success=True,
            ladder_data=ladder_data,
            device_map=device_map,
            errors=[],
            warnings=[],
            processing_time=processing_time
        )

    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds()
        return ConversionResponse(
            success=False,
            ladder_data={'rungs': [], 'metadata': {'plc_type': request.plc_type, 'generated_at': datetime.now().isoformat()}},
            device_map={'inputs': {}, 'outputs': {}, 'internals': {}, 'timers': {}, 'counters': {}},
            errors=[str(e)],
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