const boardElement = document.getElementById("board");

        const statusElement = document.getElementById("status");
        const resetBtn = document.getElementById("resetBtn");
        const modalOverlay = document.getElementById("modalOverlay");
        const modalMessage = document.getElementById("modalMessage");
        const modalBtn = document.getElementById("modalBtn");

        const pieceSymbols = {
            P: "♙",
            N: "♘",
            B: "♗",
            R: "♖",
            Q: "♕",
            K: "♔",
            p: "♟︎",
            n: "♞",
            b: "♝",
            r: "♜",
            q: "♛",
            k: "♚",
        };

        const pieceValues = {
            p: 100,
            n: 320,
            b: 330,
            r: 500,
            q: 900,
            k: 20000,
        };

        let board = [];
        let currentTurn = "white";
        let selectedSquare = null;
        let legalMoves = [];
        let gameOver = false;

        function createEmptyBoard() {
            return Array.from({ length: 8 }, () => Array(8).fill("."));
        }

        function cloneBoard(source) {
            return source.map(row => row.slice());
        }

        function initializeBoard() {
            board = [
                ["r", "n", "b", "q", "k", "b", "n", "r"],
                ["p", "p", "p", "p", "p", "p", "p", "p"],
                [".", ".", ".", ".", ".", ".", ".", "."],
                [".", ".", ".", ".", ".", ".", ".", "."],
                [".", ".", ".", ".", ".", ".", ".", "."],
                [".", ".", ".", ".", ".", ".", ".", "."],
                ["P", "P", "P", "P", "P", "P", "P", "P"],
                ["R", "N", "B", "Q", "K", "B", "N", "R"],
            ];
            currentTurn = "white";
            selectedSquare = null;
            legalMoves = [];
            gameOver = false;
            render();
            updateStatus("White to move");
        }

        function render() {
            boardElement.innerHTML = "";
            for (let row = 0; row < 8; row += 1) {
                for (let col = 0; col < 8; col += 1) {
                    const square = document.createElement("div");
                    square.className = `square ${((row + col) % 2 === 0 ? "white" : "black")}`;
                    square.dataset.row = row;
                    square.dataset.col = col;
                    const piece = board[row][col];
                    if (piece !== ".") {
                        square.textContent = pieceSymbols[piece] || piece;
                    }
                    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
                        square.classList.add("selected");
                    }
                    if (legalMoves.some(move => move.to.row === row && move.to.col === col)) {
                        square.classList.add("highlight");
                    }
                    square.addEventListener("click", () => handleSquareClick(row, col));
                    boardElement.appendChild(square);
                }
            }
        }

        function updateStatus(message) {
            statusElement.textContent = message;
        }

        function showGameOverModal(message) {
            modalMessage.textContent = message;
            modalOverlay.style.display = "flex";
        }

        function resetGameFromModal() {
            modalOverlay.style.display = "none";
            initializeBoard();
        }

        function handleSquareClick(row, col) {
            if (gameOver) {
                return;
            }

            const piece = board[row][col];
            const isWhitePiece = piece !== "." && piece === piece.toUpperCase();
            if (selectedSquare && legalMoves.length > 0) {
                const move = legalMoves.find(m => m.from.row === selectedSquare.row && m.from.col === selectedSquare.col && m.to.row === row && m.to.col === col);
                if (move) {
                    makeMove(move);
                    selectedSquare = null;
                    legalMoves = [];
                    render();
                    if (!gameOver) {
                        window.setTimeout(runComputerMove, 1000);
                    }
                    return;
                }
            }

            if (currentTurn === "white" && isWhitePiece) {
                selectedSquare = { row, col };
                legalMoves = getLegalMovesFrom(row, col, currentTurn);
                if (legalMoves.length === 0) {
                    selectedSquare = null;
                }
                render();
            }
        }

        function makeMove(move) {
            const { from, to } = move;
            const piece = board[from.row][from.col];
            board[to.row][to.col] = piece;
            board[from.row][from.col] = ".";
            if ((piece === "P" && to.row === 0) || (piece === "p" && to.row === 7)) {
                board[to.row][to.col] = piece === "P" ? "Q" : "q";
            }
            
            // Check if a king was captured
            const whiteKingExists = findKing(board, "white");
            const blackKingExists = findKing(board, "black");
            
            if (!whiteKingExists) {
                gameOver = true;
                showGameOverModal("Black Won! White King Captured.");
                return;
            }
            if (!blackKingExists) {
                gameOver = true;
                showGameOverModal("White Won! Black King Captured.");
                return;
            }
            
            currentTurn = currentTurn === "white" ? "black" : "white";
            const winner = detectGameOver();
            if (winner) {
                gameOver = true;
                if (winner === "stalemate") {
                    updateStatus("Draw by stalemate.");
                    showGameOverModal("Draw by stalemate.");
                } else {
                    const winnerName = winner === "white" ? "White" : "Black";
                    updateStatus(`${winnerName} wins by checkmate.`);
                    showGameOverModal(`${winnerName} wins by checkmate.`);
                }
                return;
            }
            updateStatus(`${currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)} to move${isInCheck(board, currentTurn) ? " — check" : ""}`);
            render();
        }

        function detectGameOver() {
            const color = currentTurn;
            const allMoves = getAllLegalMoves(color);
            if (allMoves.length === 0) {
                return isInCheck(board, color) ? (color === "white" ? "black" : "white") : "stalemate";
            }
            return null;
        }

        function runComputerMove() {
            if (gameOver || currentTurn !== "black") return;
            const move = chooseBestMove(board, "black", 1);
            if (move) {
                makeMove(move);
            } else {
                gameOver = true;
                updateStatus("Draw by no available move.");
                showGameOverModal("Draw by no available move.");
            }
        }

        function getAllLegalMoves(color) {
            const moves = [];
            for (let row = 0; row < 8; row += 1) {
                for (let col = 0; col < 8; col += 1) {
                    const piece = board[row][col];
                    if (piece === ".") continue;
                    if (color === "white" ? piece === piece.toUpperCase() : piece === piece.toLowerCase()) {
                        moves.push(...getLegalMovesFrom(row, col, color));
                    }
                }
            }
            return moves;
        }

        function getLegalMovesFrom(row, col, color) {
            const piece = board[row][col];
            if (piece === ".") return [];
            const moves = generateMoves(board, row, col, piece);
            return moves.filter(move => {
                const nextBoard = cloneBoard(board);
                nextBoard[move.to.row][move.to.col] = nextBoard[move.from.row][move.from.col];
                nextBoard[move.from.row][move.from.col] = ".";
                if ((move.promotion && move.promotion !== "")) {
                    nextBoard[move.to.row][move.to.col] = move.promotion;
                }
                return !isInCheck(nextBoard, color);
            });
        }

        function isInCheck(boardState, color) {
            const opponent = color === "white" ? "black" : "white";
            const kingPos = findKing(boardState, color);
            if (!kingPos) return false;
            return isSquareAttacked(boardState, kingPos.row, kingPos.col, opponent);
        }

        function findKing(boardState, color) {
            const kingChar = color === "white" ? "K" : "k";
            for (let row = 0; row < 8; row += 1) {
                for (let col = 0; col < 8; col += 1) {
                    if (boardState[row][col] === kingChar) {
                        return { row, col };
                    }
                }
            }
            return null;
        }

        function isSquareAttacked(boardState, row, col, attackerColor) {
            const directions = [
                { dr: -1, dc: 0 },
                { dr: 1, dc: 0 },
                { dr: 0, dc: -1 },
                { dr: 0, dc: 1 },
                { dr: -1, dc: -1 },
                { dr: -1, dc: 1 },
                { dr: 1, dc: -1 },
                { dr: 1, dc: 1 },
            ];
            const isOpponent = piece => piece !== "." && (attackerColor === "white" ? piece === piece.toUpperCase() : piece === piece.toLowerCase());

            for (const { dr, dc } of directions) {
                let steps = 1;
                while (true) {
                    const r = row + dr * steps;
                    const c = col + dc * steps;
                    if (r < 0 || r > 7 || c < 0 || c > 7) break;
                    const piece = boardState[r][c];
                    if (piece !== ".") {
                        if (!isOpponent(piece)) break;
                        const deltaR = dr * steps;
                        const deltaC = dc * steps;
                        const target = piece.toLowerCase();
                        if (steps === 1 && target === "k") return true;
                        if (target === "q") return true;
                        if (target === "r" && (dr === 0 || dc === 0)) return true;
                        if (target === "b" && dr !== 0 && dc !== 0) return true;
                        break;
                    }
                    steps += 1;
                }
            }

            const knightOffsets = [
                { dr: -2, dc: -1 }, { dr: -2, dc: 1 }, { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
                { dr: 1, dc: -2 }, { dr: 1, dc: 2 }, { dr: 2, dc: -1 }, { dr: 2, dc: 1 },
            ];
            for (const { dr, dc } of knightOffsets) {
                const r = row + dr;
                const c = col + dc;
                if (r < 0 || r > 7 || c < 0 || c > 7) continue;
                const piece = boardState[r][c];
                if (piece !== "." && isOpponent(piece) && piece.toLowerCase() === "n") {
                    return true;
                }
            }

            const pawnDirections = attackerColor === "white" ? [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }] : [{ dr: 1, dc: -1 }, { dr: 1, dc: 1 }];
            for (const { dr, dc } of pawnDirections) {
                const r = row + dr;
                const c = col + dc;
                if (r < 0 || r > 7 || c < 0 || c > 7) continue;
                const piece = boardState[r][c];
                if (piece !== "." && isOpponent(piece) && piece.toLowerCase() === "p") {
                    return true;
                }
            }

            return false;
        }

        function generateMoves(state, row, col, piece) {
            const moves = [];
            const isWhite = piece === piece.toUpperCase();
            const targetColor = isWhite ? "black" : "white";
            const ownPiece = cell => cell !== "." && (isWhite ? cell === cell.toUpperCase() : cell === cell.toLowerCase());
            const enemyPiece = cell => cell !== "." && !ownPiece(cell);

            if (piece.toLowerCase() === "p") {
                const dir = isWhite ? -1 : 1;
                const start = isWhite ? 6 : 1;
                const promotionRow = isWhite ? 0 : 7;
                const forwardRow = row + dir;
                if (forwardRow >= 0 && forwardRow <= 7 && state[forwardRow][col] === ".") {
                    moves.push({ from: { row, col }, to: { row: forwardRow, col }, promotion: forwardRow === promotionRow ? (isWhite ? "Q" : "q") : "" });
                    if (row === start) {
                        const jumpRow = row + dir * 2;
                        if (state[jumpRow][col] === ".") {
                            moves.push({ from: { row, col }, to: { row: jumpRow, col }, promotion: "" });
                        }
                    }
                }
                for (const dc of [-1, 1]) {
                    const captureRow = row + dir;
                    const captureCol = col + dc;
                    if (captureRow < 0 || captureRow > 7 || captureCol < 0 || captureCol > 7) continue;
                    if (enemyPiece(state[captureRow][captureCol])) {
                        moves.push({ from: { row, col }, to: { row: captureRow, col: captureCol }, promotion: captureRow === promotionRow ? (isWhite ? "Q" : "q") : "" });
                    }
                }
            }

            const knightSteps = [
                { dr: -2, dc: -1 }, { dr: -2, dc: 1 }, { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
                { dr: 1, dc: -2 }, { dr: 1, dc: 2 }, { dr: 2, dc: -1 }, { dr: 2, dc: 1 },
            ];
            if (piece.toLowerCase() === "n") {
                for (const { dr, dc } of knightSteps) {
                    const r = row + dr;
                    const c = col + dc;
                    if (r < 0 || r > 7 || c < 0 || c > 7) continue;
                    if (!ownPiece(state[r][c])) {
                        moves.push({ from: { row, col }, to: { row: r, col: c }, promotion: "" });
                    }
                }
            }

            const straight = [
                { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
            ];
            const diagonal = [
                { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
            ];
            if (piece.toLowerCase() === "b" || piece.toLowerCase() === "q") {
                for (const dir of diagonal) {
                    for (let step = 1; step < 8; step += 1) {
                        const r = row + dir.dr * step;
                        const c = col + dir.dc * step;
                        if (r < 0 || r > 7 || c < 0 || c > 7) break;
                        if (ownPiece(state[r][c])) break;
                        moves.push({ from: { row, col }, to: { row: r, col: c }, promotion: "" });
                        if (enemyPiece(state[r][c])) break;
                    }
                }
            }
            if (piece.toLowerCase() === "r" || piece.toLowerCase() === "q") {
                for (const dir of straight) {
                    for (let step = 1; step < 8; step += 1) {
                        const r = row + dir.dr * step;
                        const c = col + dir.dc * step;
                        if (r < 0 || r > 7 || c < 0 || c > 7) break;
                        if (ownPiece(state[r][c])) break;
                        moves.push({ from: { row, col }, to: { row: r, col: c }, promotion: "" });
                        if (enemyPiece(state[r][c])) break;
                    }
                }
            }
            if (piece.toLowerCase() === "k") {
                const kingSteps = [...straight, ...diagonal];
                for (const { dr, dc } of kingSteps) {
                    const r = row + dr;
                    const c = col + dc;
                    if (r < 0 || r > 7 || c < 0 || c > 7) continue;
                    if (!ownPiece(state[r][c])) {
                        moves.push({ from: { row, col }, to: { row: r, col: c }, promotion: "" });
                    }
                }
            }
            return moves;
        }

        function evaluateBoard(boardState) {
            let score = 0;
            for (let row = 0; row < 8; row += 1) {
                for (let col = 0; col < 8; col += 1) {
                    const piece = boardState[row][col];
                    if (piece === ".") continue;
                    const value = pieceValues[piece.toLowerCase()] || 0;
                    score += piece === piece.toUpperCase() ? value : -value;
                }
            }
            return score;
        }

        function chooseBestMove(state, color, depth) {
            const moves = getAllLegalMovesState(state, color);
            if (moves.length === 0) return null;
            let bestScore = color === "black" ? Infinity : -Infinity;
            let bestMoves = [];
            for (const move of moves) {
                const nextBoard = cloneBoard(state);
                nextBoard[move.to.row][move.to.col] = nextBoard[move.from.row][move.from.col];
                nextBoard[move.from.row][move.from.col] = ".";
                if (move.promotion) nextBoard[move.to.row][move.to.col] = move.promotion;
                const score = minimax(nextBoard, depth - 1, -Infinity, Infinity, color === "white" ? "black" : "white");
                if (color === "black") {
                    if (score < bestScore) {
                        bestScore = score;
                        bestMoves = [move];
                    } else if (score === bestScore) {
                        bestMoves.push(move);
                    }
                } else {
                    if (score > bestScore) {
                        bestScore = score;
                        bestMoves = [move];
                    } else if (score === bestScore) {
                        bestMoves.push(move);
                    }
                }
            }
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }

        function minimax(state, depth, alpha, beta, player) {
            const gameOverColor = detectGameOverState(state, player);
            if (gameOverColor) {
                if (gameOverColor === "stalemate") return 0;
                return gameOverColor === "white" ? 100000 : -100000;
            }
            if (depth === 0) {
                return evaluateBoard(state);
            }
            const moves = getAllLegalMovesState(state, player);
            if (player === "white") {
                let maxEval = -Infinity;
                for (const move of moves) {
                    const nextBoard = cloneBoard(state);
                    nextBoard[move.to.row][move.to.col] = nextBoard[move.from.row][move.from.col];
                    nextBoard[move.from.row][move.from.col] = ".";
                    if (move.promotion) nextBoard[move.to.row][move.to.col] = move.promotion;
                    const evalScore = minimax(nextBoard, depth - 1, alpha, beta, "black");
                    maxEval = Math.max(maxEval, evalScore);
                    alpha = Math.max(alpha, evalScore);
                    if (beta <= alpha) break;
                }
                return maxEval;
            }
            let minEval = Infinity;
            for (const move of moves) {
                const nextBoard = cloneBoard(state);
                nextBoard[move.to.row][move.to.col] = nextBoard[move.from.row][move.from.col];
                nextBoard[move.from.row][move.from.col] = ".";
                if (move.promotion) nextBoard[move.to.row][move.to.col] = move.promotion;
                const evalScore = minimax(nextBoard, depth - 1, alpha, beta, "white");
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }

        function detectGameOverState(state, turn) {
            const moves = getAllLegalMovesState(state, turn);
            if (moves.length > 0) return null;
            return isInCheck(state, turn) ? (turn === "white" ? "black" : "white") : "stalemate";
        }

        function getAllLegalMovesState(state, color) {
            const moves = [];
            for (let row = 0; row < 8; row += 1) {
                for (let col = 0; col < 8; col += 1) {
                    const piece = state[row][col];
                    if (piece === ".") continue;
                    if (color === "white" ? piece === piece.toUpperCase() : piece === piece.toLowerCase()) {
                        moves.push(...getLegalMovesFromState(state, row, col, color));
                    }
                }
            }
            return moves;
        }

        function getLegalMovesFromState(state, row, col, color) {
            const piece = state[row][col];
            if (piece === ".") return [];
            const moves = generateMoves(state, row, col, piece);
            return moves.filter(move => {
                const nextBoard = cloneBoard(state);
                nextBoard[move.to.row][move.to.col] = nextBoard[move.from.row][move.from.col];
                nextBoard[move.from.row][move.from.col] = ".";
                if (move.promotion) nextBoard[move.to.row][move.to.col] = move.promotion;
                return !isInCheck(nextBoard, color);
            });
        }

        resetBtn.addEventListener("click", initializeBoard);
        modalBtn.addEventListener("click", resetGameFromModal);
        initializeBoard();
