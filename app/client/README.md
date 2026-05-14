# FastAPI HTML Client with Zoom-Fit Graph Frame

This version updates the D3 topology viewer so the frame around the graph can shrink when the graph is zoomed out.

## Main behaviour

- Initial graph frame starts stable at full card width and 620px height.
- Manual resize is still available using the blue bottom-right handle.
- Mouse-wheel zoom-out triggers frame fitting after the zoom gesture ends.
- The `Zoom Out` button also shrinks the frame after zooming out.
- `Fit Frame to Graph` explicitly resizes the frame around the currently visible graph.
- `Reset View` restores the frame to full width and 620px height.

## Install

```bash
pip install -r requirements.txt
```

## Run your shortest-path server first

```bash
uvicorn main:app --reload --port 8080
```

## Run this client app

```bash
uvicorn main:app --reload --port 9000
```

Open:

```text
http://localhost:9000
```
