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
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  console.log('LadderViewComponent received:', ladderData);

  const GRID_SIZE = 20;
  const RUNG_HEIGHT = 100;
  const ELEMENT_WIDTH = 60;
  const ELEMENT_HEIGHT = 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ladderData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);

    drawGrid(ctx, canvas.width, canvas.height);
    drawLadderRungs(ctx, ladderData.rungs);

    ctx.restore();
  }, [ladderData, scale, offset]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#f0f0f0';
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
  };

  const drawLadderRungs = (ctx: CanvasRenderingContext2D, rungs: any[]) => {
    rungs.forEach((rung, rungIndex) => {
      const y = rungIndex * RUNG_HEIGHT + 20;

      drawPowerRail(ctx, y);

      if (rung.elements) {
        rung.elements.forEach((element: LadderElement, elementIndex: number) => {
          const x = elementIndex * ELEMENT_WIDTH + 40;
          drawElement(ctx, element, x, y);

          if (elementIndex < rung.elements.length - 1) {
            drawConnection(ctx, x + ELEMENT_WIDTH, y + ELEMENT_HEIGHT / 2,
                         x + ELEMENT_WIDTH + 20, y + ELEMENT_HEIGHT / 2);
          }
        });
      }
    });
  };

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
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    if (normallyOpen) {
      ctx.lineTo(x - 5, y);
      ctx.moveTo(x + 5, y);
    } else {
      ctx.lineTo(x - 8, y - 8);
      ctx.moveTo(x - 8, y + 8);
    }
    ctx.lineTo(x + 20, y);
    ctx.stroke();

    if (!normallyOpen) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 8);
      ctx.lineTo(x + 8, y + 8);
      ctx.stroke();
    }
  };

  const drawCoil = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x - 10, y);
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 20, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
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
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta * 0.1)));
  };

  const handlePan = (dx: number, dy: number) => {
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
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
    <div className="border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-medium text-gray-700">
          ラダーダイアグラム ({ladderData.rungs.length} ラング)
        </span>
        <div className="flex space-x-0.5">
          <button
            onClick={() => handleZoom(-1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="縮小"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={() => handleZoom(1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="拡大"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-1 hover:bg-gray-200 rounded text-[10px] transition-colors"
            title="リセット"
          >
            100%
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="bg-white cursor-move"
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
    </div>
  );
};

export default LadderViewComponent;