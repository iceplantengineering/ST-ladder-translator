import React, { useRef, useEffect, useState } from 'react';

interface LadderViewComponentProps {
  ladderData?: {
    rungs: any[];
    metadata: {
      plcType: string;
      generatedAt: string;
    };
  } | null;
  width?: number;
  height?: number;
}

interface LadderElement {
  type: 'contact' | 'coil' | 'function' | 'line';
  address?: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isNormallyOpen?: boolean;
  label?: string;
}

const LadderViewComponent: React.FC<LadderViewComponentProps> = ({
  ladderData,
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  console.log('LadderViewComponent received:', ladderData);
  console.log('Number of rungs:', ladderData?.rungs?.length || 0);
  if (ladderData?.rungs) {
    ladderData.rungs.forEach((rung, index) => {
      console.log(`Rung ${index}:`, rung);
      console.log(`Rung ${index} elements:`, rung.elements?.length || 0);
    });
  }

  const GRID_SIZE = 20;
  const RUNG_HEIGHT = 100;
  const ELEMENT_WIDTH = 60;
  const ELEMENT_HEIGHT = 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ladderData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('Canvas dimensions:', canvas.width, canvas.height);
    console.log('Drawing with scale:', scale, 'offset:', offset);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ladder rungs with proper coordinates
    console.log('Drawing ladder elements with proper positioning');
    drawLadderRungsFixed(ctx, ladderData.rungs);

  }, [ladderData, scale, offset, canvasSize]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    console.log(`Drawing grid: ${width}x${height}`);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw border to show canvas boundaries
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  };

  const drawLadderRungsFixed = (ctx: CanvasRenderingContext2D, rungs: any[]) => {
    console.log('drawLadderRungsFixed called with', rungs.length, 'rungs');

    // Clear previous coordinate system and test shapes - focus just on ladder
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const START_Y = 80; // Start position for first rung
    const RUNG_SPACING = 120; // Space between rungs
    const POWER_RAIL_X = 30;
    const ELEMENT_SPACING = 150; // Space between elements

    rungs.forEach((rung, rungIndex) => {
      const rungY = START_Y + rungIndex * RUNG_SPACING;
      console.log(`Drawing fixed rung ${rungIndex} at y=${rungY}`);

      // Draw power rail for this rung
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(POWER_RAIL_X, rungY + 20);
      ctx.lineTo(POWER_RAIL_X, rungY + 80);
      ctx.stroke();

      if (rung.elements && rung.elements.length > 0) {
        console.log(`Rung ${rungIndex} has ${rung.elements.length} elements`);

        // Draw each element in the rung
        rung.elements.forEach((element: LadderElement, elementIndex: number) => {
          const elementX = POWER_RAIL_X + 60 + elementIndex * ELEMENT_SPACING;
          const elementY = rungY + 50; // Center in rung

          console.log(`Drawing element ${elementIndex}: ${element.type} (${element.address}) at (${elementX}, ${elementY})`);

          // Draw the element based on its type
          if (element.type === 'contact') {
            drawContactFixed(ctx, elementX, elementY, element.isNormallyOpen !== false, element.address || '');
          } else if (element.type === 'coil') {
            drawCoilFixed(ctx, elementX, elementY, element.address || '');
          }

          // Draw connection from power rail to first element
          if (elementIndex === 0) {
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(POWER_RAIL_X, elementY);
            ctx.lineTo(elementX - 30, elementY);
            ctx.stroke();
          }

          // Draw connection to next element
          if (elementIndex < rung.elements.length - 1) {
            const nextElementX = POWER_RAIL_X + 60 + (elementIndex + 1) * ELEMENT_SPACING;
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(elementX + 30, elementY);
            ctx.lineTo(nextElementX - 30, elementY);
            ctx.stroke();
          }
        });
      }
    });
  };

  const drawContactFixed = (ctx: CanvasRenderingContext2D, x: number, y: number, normallyOpen: boolean, address: string) => {
    console.log(`Drawing fixed contact at (${x}, ${y}), address: ${address}`);

    // Draw connection lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;

    // Left line
    ctx.beginPath();
    ctx.moveTo(x - 30, y);
    ctx.lineTo(x - 10, y);
    ctx.stroke();

    // Right line
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 30, y);
    ctx.stroke();

    // Contact symbol
    if (normallyOpen) {
      // Open contact - draw two separate lines with gap
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x - 2, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 2, y);
      ctx.lineTo(x + 10, y);
      ctx.stroke();
    } else {
      // Closed contact - draw continuous line with diagonal
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.stroke();

      // Diagonal line for closed contact
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 6);
      ctx.lineTo(x + 6, y + 6);
      ctx.stroke();
    }

    // Draw address label
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(address, x, y + 25);
  };

  const drawCoilFixed = (ctx: CanvasRenderingContext2D, x: number, y: number, address: string) => {
    console.log(`Drawing fixed coil at (${x}, ${y}), address: ${address}`);

    // Draw connection lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;

    // Left line
    ctx.beginPath();
    ctx.moveTo(x - 30, y);
    ctx.lineTo(x - 15, y);
    ctx.stroke();

    // Right line
    ctx.beginPath();
    ctx.moveTo(x + 15, y);
    ctx.lineTo(x + 30, y);
    ctx.stroke();

    // Draw coil circle
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Draw address label
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(address, x, y + 25);
  };

  const drawLadderRungs = (ctx: CanvasRenderingContext2D, rungs: any[]) => {
    console.log('drawLadderRungs called with', rungs.length, 'rungs');
    console.log('RUNG_HEIGHT:', RUNG_HEIGHT);
    rungs.forEach((rung, rungIndex) => {
      const y = rungIndex * RUNG_HEIGHT + 20;
      console.log(`Drawing rung ${rungIndex} at y=${y}, elements:`, rung.elements);
      console.log(`Canvas height should be at least ${y + RUNG_HEIGHT + 20}`);

      drawPowerRail(ctx, y);

      if (rung.elements) {
        // Simple linear drawing - just draw all elements in order
        rung.elements.forEach((element: LadderElement, elementIndex: number) => {
          const x = element.x || (elementIndex * ELEMENT_WIDTH + 40);
          const elementY = element.y || y;
          console.log(`Rung ${rungIndex} Element ${elementIndex}: ${element.type} at (${x}, ${elementY}), address: ${element.address}`);
          drawElement(ctx, element, x, elementY);

          // Draw connections between elements
          if (elementIndex < rung.elements.length - 1) {
            const nextElement = rung.elements[elementIndex + 1];
            const nextX = nextElement.x || ((elementIndex + 1) * ELEMENT_WIDTH + 40);
            const nextY = nextElement.y || y;

            console.log(`Drawing connection from (${x + ELEMENT_WIDTH}, ${elementY + ELEMENT_HEIGHT/2}) to (${nextX}, ${nextY + ELEMENT_HEIGHT/2})`);
            drawConnection(ctx, x + ELEMENT_WIDTH, elementY + ELEMENT_HEIGHT / 2,
                           nextX, nextY + ELEMENT_HEIGHT / 2);
          }
        });

        // Draw power rail connections
        if (rung.elements.length > 0) {
          const firstElement = rung.elements[0];
          const firstX = firstElement.x || 40;
          const firstY = firstElement.y || y;

          // Connect left rail to first element
          drawConnection(ctx, 20, firstY + ELEMENT_HEIGHT / 2, firstX, firstY + ELEMENT_HEIGHT / 2);
        }
      }
    });
  };

  // Calculate the total dimensions of the ladder diagram
  const calculateDiagramDimensions = () => {
    if (!ladderData || ladderData.rungs.length === 0) {
      return { width: 800, height: 400 };
    }

    const START_Y = 80;
    const RUNG_SPACING = 120;
    const POWER_RAIL_X = 30;
    const ELEMENT_SPACING = 150;

    const maxElements = Math.max(...ladderData.rungs.map(rung => rung.elements?.length || 0));
    const requiredWidth = POWER_RAIL_X + 60 + maxElements * ELEMENT_SPACING + 50;
    const requiredHeight = START_Y + ladderData.rungs.length * RUNG_SPACING + 100;

    const diagramWidth = Math.max(800, requiredWidth);
    const diagramHeight = Math.max(400, requiredHeight);

    console.log('Fixed layout dimensions:', {
      rungsCount: ladderData.rungs.length,
      maxElements: maxElements,
      requiredWidth: requiredWidth,
      requiredHeight: requiredHeight,
      finalWidth: diagramWidth,
      finalHeight: diagramHeight
    });

    return { width: diagramWidth, height: diagramHeight };
  };

  // Fit diagram to screen
  const fitToScreen = () => {
    if (!containerRef.current || !ladderData || ladderData.rungs.length === 0) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - 40; // Padding
    const availableHeight = containerRect.height - 40; // Padding

    const diagramDimensions = calculateDiagramDimensions();

    const scaleX = availableWidth / diagramDimensions.width;
    const scaleY = availableHeight / diagramDimensions.height;
    const newScale = Math.min(scaleX, scaleY, 1.5); // Cap at 1.5x zoom

    console.log('Fit to screen:', { availableWidth, availableHeight, diagramDimensions, newScale });

    setScale(newScale);
    setOffset({ x: 20, y: 20 }); // Start with some padding
  };

  // Update canvas size when ladder data changes
  useEffect(() => {
    if (ladderData && ladderData.rungs.length > 0) {
      const dimensions = calculateDiagramDimensions();
      console.log('Setting canvas size to:', dimensions);
      setCanvasSize(dimensions);
      // Reset scale to 1 and no offset for testing
      setScale(1);
      setOffset({ x: 0, y: 0 });
      // Don't call fitToScreen for now to test 1:1 scaling
    } else {
      // Reset to default size when no data
      setCanvasSize({ width: 800, height: 600 });
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [ladderData]);

  const drawPowerRail = (ctx: CanvasRenderingContext2D, y: number) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(20, y + RUNG_HEIGHT - 20);
    ctx.stroke();
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: LadderElement, x: number, y: number) => {
    const centerX = x + ELEMENT_WIDTH / 2;
    const centerY = y + ELEMENT_HEIGHT / 2;

    console.log(`Drawing element: ${element.type} at (${x}, ${y}), center: (${centerX}, ${centerY})`);

    switch (element.type) {
      case 'contact':
        drawContact(ctx, centerX, centerY, element.isNormallyOpen !== false);
        break;
      case 'coil':
        drawCoil(ctx, centerX, centerY);
        break;
      case 'function':
        drawFunction(ctx, x, y, element.label || 'FUNC');
        break;
    }

    if (element.address || element.description) {
      drawLabel(ctx, centerX, y + ELEMENT_HEIGHT + 15, element.address || '');
    }
  };

  const drawContact = (ctx: CanvasRenderingContext2D, x: number, y: number, normallyOpen: boolean) => {
    console.log(`Drawing contact at (${x}, ${y}), normallyOpen: ${normallyOpen}`);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;

    ctx.beginPath();
    // Left line
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x - 8, y);

    if (normallyOpen) {
      // Open contact - gap in the middle
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x - 2, y);

      // Gap
      ctx.moveTo(x + 2, y);
      ctx.lineTo(x + 8, y);
    } else {
      // Closed contact - diagonal line
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);

      // Diagonal line for closed contact
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 6);
      ctx.lineTo(x + 6, y + 6);
      ctx.stroke();
    }

    // Right line
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + 20, y);

    ctx.stroke();
  };

  const drawCoil = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    console.log(`Drawing coil at (${x}, ${y})`);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;

    // Left line
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x - 15, y);
    ctx.stroke();

    // Coil circle
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Right line
    ctx.beginPath();
    ctx.moveTo(x + 15, y);
    ctx.lineTo(x + 20, y);
    ctx.stroke();
  };

  const drawFunction = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string) => {
    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#f8f8f8';
    ctx.lineWidth = 2;

    ctx.fillRect(x, y, ELEMENT_WIDTH, ELEMENT_HEIGHT);
    ctx.strokeRect(x, y, ELEMENT_WIDTH, ELEMENT_HEIGHT);

    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + ELEMENT_WIDTH / 2, y + ELEMENT_HEIGHT / 2);
  };

  const drawLabel = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
    if (!text) return;

    console.log(`Drawing label "${text}" at (${x}, ${y})`);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw background
    const metrics = ctx.measureText(text);
    const padding = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(x - metrics.width/2 - padding, y - 10, metrics.width + padding * 2, 20);

    // Draw text
    ctx.fillStyle = '#2563eb';
    ctx.fillText(text, x, y);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta * 0.1)));
  };

  const handlePan = (dx: number, dy: number) => {
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  if (!ladderData || ladderData.rungs.length === 0) {
    return (
      <div className="border rounded-lg bg-gray-50 flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2 text-xs">ラダープログラムが生成されていません</p>
          <p className="text-[10px] text-gray-400 mt-0.5">ファイルをアップロードして変換を実行してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
      <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            ラダーダイアグラム ({ladderData.rungs.length} ラング)
          </span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            拡大率: {(scale * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {/* Zoom controls */}
          <div className="flex border rounded bg-white">
            <button
              onClick={() => handleZoom(-1)}
              className="p-1 hover:bg-gray-100 rounded-l transition-colors"
              title="縮小"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={() => handleZoom(1)}
              className="p-1 hover:bg-gray-100 border-l transition-colors"
              title="拡大"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* View controls */}
          <div className="flex border rounded bg-white">
            <button
              onClick={fitToScreen}
              className="p-1 hover:bg-gray-100 rounded-l transition-colors text-xs"
              title="全体表示"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={resetView}
              className="p-1 hover:bg-gray-100 border-l rounded-r transition-colors text-xs"
              title="リセット"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-50"
        style={{
          minHeight: `${Math.max(600, canvasSize.height + 100)}px`,
          maxHeight: 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="bg-white cursor-move shadow-sm"
          style={{
            margin: '10px',
            border: '3px solid #ef4444',
            borderRadius: '4px',
            backgroundColor: '#ffffff'
          }}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              handlePan(
                (moveEvent.clientX - startX) / scale,
                (moveEvent.clientY - startY) / scale
              );
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t text-xs text-gray-500 flex items-center justify-between">
        <span>
          ドラッグしてパン | ホイールでズーム
        </span>
        <span>
          全要素: {ladderData.rungs.reduce((total, rung) => total + (rung.elements?.length || 0), 0)} 個
        </span>
      </div>
    </div>
  );
};

export default LadderViewComponent;