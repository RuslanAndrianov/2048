import { Grid } from "./grid.js";
import { Tile } from "./tile.js";
import { scoreContainer } from "./cell.js";
import { GRID_SIZE } from "./global.js";

const gameBoard = document.getElementById("game-board");

const maxScoreContainer = document.getElementById("maxscore");

const grid = new Grid(gameBoard);

gameBoard.style.setProperty("--board-size", GRID_SIZE);

if (localStorage.maxScore)
{
    maxScoreContainer.innerHTML = localStorage.maxScore;
}

for (let i = 0; i < Math.sqrt(GRID_SIZE); i++)
{
    grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
}

setupInputOnce();

function setupInputOnce() 
{
    let score = scoreContainer.innerHTML;
    if (score > +localStorage.maxScore || !localStorage.maxScore)
    {
        localStorage.maxScore = score;
        maxScoreContainer.innerHTML = score;
    }
    window.addEventListener("keydown", handleInput, { once: true });
}

async function handleInput(event) 
{
    switch (event.key) 
    {
        case "w":
        case "ArrowUp":
            if (!canMoveUp())
            {
                setupInputOnce();
                return;
            }
            await moveUp();
            break;

        case "s":
        case "ArrowDown":
            if (!canMoveDown())
            {
                setupInputOnce();
                return;
            }    
            await moveDown();
            break;
            
        case "a":
        case "ArrowLeft":
            if (!canMoveLeft())
            {
                setupInputOnce();
                return;
            }
            await moveLeft();
            break;
        
        case "d":
        case "ArrowRight":
            if (!canMoveRight())
            {
                setupInputOnce();
                return;
            }
            await moveRight();
            break;
        
        default:
            setupInputOnce();        
            return;
    }
    
    const newTile = new Tile(gameBoard);
    grid.getRandomEmptyCell().linkTile(newTile);

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) 
    {
        await newTile.waitForAnimationEnd();
        let score = scoreContainer.innerHTML;
        if (score >= +localStorage.maxScore || !localStorage.maxScore)
        {
            localStorage.maxScore = score;
            maxScoreContainer.innerHTML = score;
            alert(`New record! Your score: ${score}`);
            return;
        }
        alert("Try again!");
        return;
    }
    
    setupInputOnce();
}

async function moveUp() 
{
    await slideTiles(grid.cellsGroupedByColumn);
}

async function moveDown() 
{
    await slideTiles(grid.cellsGroupedByReversedColumn);
}

async function moveLeft() 
{
    await slideTiles(grid.cellsGroupedByRow);
}

async function moveRight() 
{
    await slideTiles(grid.cellsGroupedByReversedRow);
}

async function slideTiles(groupedCells) 
{
    const promises = [];
    
    groupedCells.forEach(group => slideTilesInGroup(group, promises));

    await Promise.all(promises);

    grid.cells.forEach(cell => {
        cell.hasTileForMerge() && cell.mergeTiles();
    });
}

function slideTilesInGroup(group, promises) 
{
    for (let i = 1; i < group.length; i++)
    {
        if (group[i].isEmpty())
        {
            continue;
        }

        const cellWithTile = group[i];

        let targetCell;
        let j = i - 1;
        while (j >= 0 && group[j].canAccept(cellWithTile.linkedTile))
        {
            targetCell = group[j];
            j--;
        }

        if (!targetCell)
        {
            continue;
        }

        promises.push(cellWithTile.linkedTile.waitForTransitionEnd());

        if (targetCell.isEmpty())
        {
            targetCell.linkTile(cellWithTile.linkedTile);
        }
        else 
        {
            targetCell.linkTileForMerge(cellWithTile.linkedTile);
        }

        cellWithTile.unlinkTile();
    }    
}

function canMoveUp() 
{
    return canMove(grid.cellsGroupedByColumn);
}

function canMoveDown() 
{
    return canMove(grid.cellsGroupedByReversedColumn);
}

function canMoveLeft() 
{
    return canMove(grid.cellsGroupedByRow);
}

function canMoveRight() 
{
    return canMove(grid.cellsGroupedByReversedRow);
}

function canMove(groupedCells) 
{
    return groupedCells.some(group => canMoveInGroup(group));
}

function canMoveInGroup(group) 
{
    return group.some((cell, index) => {
        if (index === 0)
        {
            return false;
        }

        if (cell.isEmpty())
        {
            return false;
        }

        const targetCell = group[index - 1];
        return targetCell.canAccept(cell.linkedTile);

    });
}