// Simple test program for automated warehouse
VAR
    sensor : BOOL;
    motor : BOOL;
    conveyor : BOOL;
END_VAR

// Control logic
IF sensor THEN
    motor := TRUE;
    conveyor := TRUE;
ELSE
    motor := FALSE;
    conveyor := FALSE;
END_IF;

// Assignment test
count := count + 1;
speed := 100;