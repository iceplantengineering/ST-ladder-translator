from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import os
import re
from datetime import datetime

class StructuredLanguageParser:
    def parse(self, source_code: str) -> dict:
        lines = source_code.strip().split('\n')
        ast = {
            'variables': {},
            'statements': [],
            'functions': {}
        }

        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith('//') or line.startswith('(*'):
                continue

            # Parse variable declarations
            if ':' in line and ('VAR' in line or 'VAR_INPUT' in line or 'VAR_OUTPUT' in line):
                self._parse_variable_declaration(line, ast)

            # Parse IF statements
            elif line.startswith('IF'):
                if_statement = self._parse_if_statement(lines, line_num - 1)
                ast['statements'].append(if_statement)

            # Parse assignment statements
            elif ':=' in line:
                assignment = self._parse_assignment(line)
                ast['statements'].append(assignment)

        return ast

    def _parse_variable_declaration(self, line: str, ast: dict):
        match = re.match(r'(\w+)\s*:\s*(\w+)', line)
        if match:
            var_name, var_type = match.groups()
            ast['variables'][var_name] = var_type

    def _parse_if_statement(self, lines: list, start_idx: int) -> dict:
        statement = {
            'type': 'if',
            'condition': '',
            'then_block': [],
            'else_block': []
        }

        # Extract condition
        line = lines[start_idx]
        if 'THEN' in line:
            condition = line.replace('IF', '').split('THEN')[0].strip()
        else:
            condition = line.replace('IF', '').strip()
        statement['condition'] = condition

        # Parse THEN block
        idx = start_idx + 1
        while idx < len(lines) and not lines[idx].strip().startswith('END_IF'):
            current_line = lines[idx].strip()
            if ':=' in current_line:
                assignment = self._parse_assignment(current_line)
                statement['then_block'].append(assignment)
            idx += 1

        return statement

    def _parse_assignment(self, line: str) -> dict:
        parts = line.split(':=')
        return {
            'type': 'assignment',
            'variable': parts[0].strip(),
            'value': parts[1].strip().rstrip(';')
        }

class LadderConverter:
    def __init__(self):
        self.device_counters = {
            'X': 0,  # Input devices
            'Y': 0,  # Output devices
            'M': 0,  # Internal relays
            'D': 0,  # Data registers
            'T': 0,  # Timers
            'C': 0   # Counters
        }

    def convert(self, ast: dict, plc_type: str) -> tuple:
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

        # Convert each statement to ladder rungs
        for statement in ast['statements']:
            if statement['type'] == 'if':
                rung, devices = self._convert_if_statement(statement)
                ladder_data['rungs'].append(rung)
                self._update_device_map(device_map, devices)

            elif statement['type'] == 'assignment':
                rung, devices = self._convert_assignment(statement)
                ladder_data['rungs'].append(rung)
                self._update_device_map(device_map, devices)

        return ladder_data, device_map

    def _convert_if_statement(self, statement: dict) -> tuple:
        # Create a sample rung for IF statement
        condition_device = f'X{self.device_counters["X"]}'
        self.device_counters["X"] += 1

        output_device = f'M{self.device_counters["M"]}'
        self.device_counters["M"] += 1

        rung = {
            'elements': [
                {
                    'type': 'contact',
                    'address': condition_device,
                    'description': f'Condition: {statement["condition"]}',
                    'isNormallyOpen': True
                },
                {
                    'type': 'coil',
                    'address': output_device,
                    'description': 'IF condition result'
                }
            ]
        }

        devices = {
            'inputs': {condition_device: statement['condition']},
            'internals': {output_device: 'IF condition result'}
        }

        return rung, devices

    def _convert_assignment(self, statement: dict) -> tuple:
        # Create a sample rung for assignment
        input_device = f'M{self.device_counters["M"]}'
        self.device_counters["M"] += 1

        output_device = f'Y{self.device_counters["Y"]}'
        self.device_counters["Y"] += 1

        rung = {
            'elements': [
                {
                    'type': 'contact',
                    'address': input_device,
                    'description': f'Input: {statement["variable"]}',
                    'isNormallyOpen': True
                },
                {
                    'type': 'coil',
                    'address': output_device,
                    'description': f'Output: {statement["variable"]} = {statement["value"]}'
                }
            ]
        }

        devices = {
            'internals': {input_device: statement['variable']},
            'outputs': {output_device: f'{statement["variable"]} = {statement["value"]}'}
        }

        return rung, devices

    def _update_device_map(self, device_map: dict, new_devices: dict):
        for device_type, devices in new_devices.items():
            if device_type in device_map:
                device_map[device_type].update(devices)

app = FastAPI(title="ST to Ladder Converter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConversionRequest(BaseModel):
    source_code: str
    plc_type: str = "mitsubishi"
    options: dict = {}

class ConversionResponse(BaseModel):
    success: bool
    ladder_data: dict
    device_map: dict
    errors: List[str]
    warnings: List[str]
    processing_time: float

@app.get("/")
async def root():
    return {"message": "ST to Ladder Converter API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/convert", response_model=ConversionResponse)
async def convert_st_to_ladder(request: ConversionRequest):
    try:
        start_time = datetime.now()

        # Parse the structured language code
        parser = StructuredLanguageParser()
        converter = LadderConverter()

        # Parse source code
        try:
            parsed_ast = parser.parse(request.source_code)
        except Exception as e:
            return ConversionResponse(
                success=False,
                ladder_data={"rungs": [], "metadata": {}},
                device_map={},
                errors=[f"構文解析エラー: {str(e)}"],
                warnings=[],
                processing_time=0
            )

        # Convert to ladder logic
        try:
            ladder_data, device_map = converter.convert(parsed_ast, request.plc_type)
        except Exception as e:
            return ConversionResponse(
                success=False,
                ladder_data={"rungs": [], "metadata": {}},
                device_map={},
                errors=[f"変換エラー: {str(e)}"],
                warnings=[],
                processing_time=0
            )

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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-convert")
async def upload_and_convert(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(('.st', '.il', '.txt')):
            raise HTTPException(status_code=400, detail="Unsupported file type")

        content = await file.read()
        source_code = content.decode('utf-8')

        request = ConversionRequest(source_code=source_code)
        return await convert_st_to_ladder(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)