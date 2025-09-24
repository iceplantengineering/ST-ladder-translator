PROGRAM AutomaticWarehouse
VAR
    // 入力信号
    StartButton AT %IX0.0 : BOOL;
    StopButton AT %IX0.1 : BOOL;
    EmergencyStop AT %IX0.2 : BOOL;
    ItemSensor1 AT %IX0.3 : BOOL;
    ItemSensor2 AT %IX0.4 : BOOL;
    PositionSensor AT %IX0.5 : BOOL;

    // 出力信号
    ConveyorMotor AT %QX0.0 : BOOL;
    LiftMotor AT %QX0.1 : BOOL;
    PusherCylinder AT %QX0.2 : BOOL;
    GreenLight AT %QX0.3 : BOOL;
    RedLight AT %QX0.4 : BOOL;

    // 内部変数
    ItemCount : INT := 0;
    CurrentPosition : INT := 0;
    SystemRunning : BOOL := FALSE;
    ErrorFlag : BOOL := FALSE;

    // タイマー
    T1 : TON;
    T2 : TON;
END_VAR

// メインロジック
IF EmergencyStop THEN
    SystemRunning := FALSE;
    ConveyorMotor := FALSE;
    LiftMotor := FALSE;
    PusherCylinder := FALSE;
    GreenLight := FALSE;
    RedLight := TRUE;
    ErrorFlag := TRUE;
ELSIF NOT ErrorFlag AND StartButton AND NOT StopButton THEN
    SystemRunning := TRUE;
    GreenLight := TRUE;
    RedLight := FALSE;
END_IF;

IF StopButton AND SystemRunning THEN
    SystemRunning := FALSE;
    ConveyorMotor := FALSE;
    LiftMotor := FALSE;
    PusherCylinder := FALSE;
    GreenLight := FALSE;
END_IF;

// コンベア制御
IF SystemRunning AND ItemSensor1 AND NOT ItemSensor2 THEN
    ConveyorMotor := TRUE;
ELSIF SystemRunning AND ItemSensor2 THEN
    ConveyorMotor := FALSE;

    // カウントアップ
    ItemCount := ItemCount + 1;

    // リフト制御
    IF ItemCount <= 10 THEN
        LiftMotor := TRUE;
        T1(IN := TRUE, PT := T#2S);
        IF T1.Q THEN
            LiftMotor := FALSE;
            PusherCylinder := TRUE;
            T2(IN := TRUE, PT := T#1S);
            IF T2.Q THEN
                PusherCylinder := FALSE;
                T1(IN := FALSE);
                T2(IN := FALSE);
            END_IF;
        END_IF;
    END_IF;

    // 満了チェック
    IF ItemCount >= 10 THEN
        SystemRunning := FALSE;
        GreenLight := FALSE;
        RedLight := TRUE;
    END_IF;
END_IF;

// エラーリセット
IF NOT EmergencyStop AND ErrorFlag AND StartButton THEN
    ErrorFlag := FALSE;
    ItemCount := 0;
    CurrentPosition := 0;
END_IF;