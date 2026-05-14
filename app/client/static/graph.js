let graphRenderer = null;

function deepCloneGraphData(data) {
    return {
        nodes: data.nodes.map(function(node) {
            return {
                id: node.id,
                label: node.label
            };
        }),
        links: data.links.map(function(link) {
            return {
                source: typeof link.source === "object" ? link.source.id : link.source,
                target: typeof link.target === "object" ? link.target.id : link.target,
                weight: link.weight
            };
        })
    };
}

function createGraphRenderer() {
    const originalGraphData = window.GRAPH_DATA;

    if (!originalGraphData || !originalGraphData.nodes || !originalGraphData.links) {
        return null;
    }

    const svg = d3.select("#graph");
    const container = document.getElementById("graph-container");

    let width = container.clientWidth;
    let height = container.clientHeight;

    let zoomLayer = null;
    let zoom = null;
    let simulation = null;
    let nodeRadius = 30;
    let currentGraphData = null;
    let currentTransform = d3.zoomIdentity;
    let zoomStartScale = 1;
    let suppressAutoFrameFit = false;
    let frameFitTimer = null;

    function draw() {
        currentGraphData = deepCloneGraphData(originalGraphData);

        width = Math.max(container.clientWidth, 300);
        height = Math.max(container.clientHeight, 300);

        svg.selectAll("*").remove();
        svg.attr("viewBox", [0, 0, width, height]);

        svg.append("rect")
            .attr("class", "zoom-catcher")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")
            .attr("pointer-events", "all");

        zoomLayer = svg.append("g").attr("class", "zoom-layer");

        zoom = d3.zoom()
            .scaleExtent([0.08, 12])
            .on("start", function(event) {
                zoomStartScale = event.transform.k;
            })
            .on("zoom", function(event) {
                currentTransform = event.transform;
                zoomLayer.attr("transform", event.transform);
            })
            .on("end", function(event) {
                currentTransform = event.transform;

                if (suppressAutoFrameFit) {
                    return;
                }

                // Only shrink/fit the frame when the user actually zoomed out.
                if (event.transform.k < zoomStartScale - 0.01) {
                    clearTimeout(frameFitTimer);
                    frameFitTimer = setTimeout(function() {
                        fitFrameToCurrentGraph(180);
                    }, 120);
                }
            });

        svg.call(zoom);

        const linkGroup = zoomLayer.append("g").attr("class", "links");
        const edgeLabelGroup = zoomLayer.append("g").attr("class", "edge-labels");
        const nodeGroup = zoomLayer.append("g").attr("class", "nodes");
        const nodeLabelGroup = zoomLayer.append("g").attr("class", "node-labels");

        const nodeCount = currentGraphData.nodes.length;

        nodeRadius = Math.max(24, Math.min(44, 360 / Math.sqrt(Math.max(nodeCount, 1))));
        const linkDistance = Math.max(90, Math.min(240, Math.min(width, height) / Math.sqrt(Math.max(nodeCount, 1)) * 3.4));
        const chargeStrength = -Math.max(260, Math.min(1600, 2600 / Math.sqrt(Math.max(nodeCount, 1))));

        if (simulation) {
            simulation.stop();
        }

        simulation = d3.forceSimulation(currentGraphData.nodes)
            .force(
                "link",
                d3.forceLink(currentGraphData.links)
                    .id(function(d) { return d.id; })
                    .distance(linkDistance)
                    .strength(0.8)
            )
            .force("charge", d3.forceManyBody().strength(chargeStrength))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(nodeRadius + 18))
            .force("x", d3.forceX(width / 2).strength(0.055))
            .force("y", d3.forceY(height / 2).strength(0.055));

        const links = linkGroup
            .selectAll("line")
            .data(currentGraphData.links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("stroke", "#2563eb")
            .attr("stroke-width", 3)
            .attr("stroke-opacity", 0.92);

        const edgeLabelBackgrounds = edgeLabelGroup
            .selectAll("circle.edge-label-bg")
            .data(currentGraphData.links)
            .enter()
            .append("circle")
            .attr("class", "edge-label-bg")
            .attr("r", 14)
            .attr("fill", "#ffffff")
            .attr("stroke", "#cbd5e1")
            .attr("stroke-width", 1);

        const edgeLabels = edgeLabelGroup
            .selectAll("text.edge-label")
            .data(currentGraphData.links)
            .enter()
            .append("text")
            .attr("class", "edge-label")
            .attr("font-size", 12)
            .attr("font-weight", 800)
            .attr("fill", "#0f172a")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text(function(d) { return d.weight; });

        const nodes = nodeGroup
            .selectAll("circle")
            .data(currentGraphData.nodes)
            .enter()
            .append("circle")
            .attr("class", "node")
            .attr("r", nodeRadius)
            .attr("fill", "#ffffff")
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 3)
            .call(
                d3.drag()
                    .on("start", dragStarted)
                    .on("drag", dragged)
                    .on("end", dragEnded)
            );

        const nodeLabels = nodeLabelGroup
            .selectAll("text")
            .data(currentGraphData.nodes)
            .enter()
            .append("text")
            .attr("class", "node-label")
            .attr("font-size", function(d) {
                return chooseLabelFontSize(nodeRadius, d.label || d.id);
            })
            .attr("font-weight", 800)
            .attr("fill", "#0f172a")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text(function(d) {
                return d.label || d.id;
            });

        nodes.append("title")
            .text(function(d) {
                return d.label || d.id;
            });

        simulation.on("tick", function() {
            currentGraphData.nodes.forEach(function(d) {
                d.x = Math.max(nodeRadius + 10, Math.min(width - nodeRadius - 10, d.x));
                d.y = Math.max(nodeRadius + 10, Math.min(height - nodeRadius - 10, d.y));
            });

            links
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            edgeLabelBackgrounds
                .attr("cx", function(d) { return (d.source.x + d.target.x) / 2; })
                .attr("cy", function(d) { return (d.source.y + d.target.y) / 2; });

            edgeLabels
                .attr("x", function(d) { return (d.source.x + d.target.x) / 2; })
                .attr("y", function(d) { return (d.source.y + d.target.y) / 2; });

            nodes
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            nodeLabels
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
        });

        setTimeout(function() {
            fitGraphToView(450);
        }, 900);

        function dragStarted(event, d) {
            event.sourceEvent.stopPropagation();

            if (!event.active) {
                simulation.alphaTarget(0.3).restart();
            }

            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = Math.max(nodeRadius + 10, Math.min(width - nodeRadius - 10, event.x));
            d.fy = Math.max(nodeRadius + 10, Math.min(height - nodeRadius - 10, event.y));
        }

        function dragEnded(event, d) {
            if (!event.active) {
                simulation.alphaTarget(0);
            }

            d.fx = null;
            d.fy = null;
        }
    }

    function chooseLabelFontSize(radius, label) {
        const length = String(label).length;

        if (length <= 3) return Math.min(15, radius * 0.52);
        if (length <= 5) return Math.min(13, radius * 0.42);
        if (length <= 8) return Math.min(11, radius * 0.33);
        return Math.min(10, radius * 0.26);
    }

    function getGraphBounds() {
        if (!currentGraphData || !currentGraphData.nodes.length) {
            return null;
        }

        const minX = d3.min(currentGraphData.nodes, function(d) { return d.x; }) - nodeRadius;
        const maxX = d3.max(currentGraphData.nodes, function(d) { return d.x; }) + nodeRadius;
        const minY = d3.min(currentGraphData.nodes, function(d) { return d.y; }) - nodeRadius;
        const maxY = d3.max(currentGraphData.nodes, function(d) { return d.y; }) + nodeRadius;

        return {
            minX,
            maxX,
            minY,
            maxY,
            width: Math.max(maxX - minX, 1),
            height: Math.max(maxY - minY, 1),
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }

    function updateSvgSize() {
        width = Math.max(container.clientWidth, 300);
        height = Math.max(container.clientHeight, 300);

        svg.attr("viewBox", [0, 0, width, height]);
        svg.select(".zoom-catcher")
            .attr("width", width)
            .attr("height", height);
    }

    function centerGraphAtScale(scale, durationMs) {
        const bounds = getGraphBounds();

        if (!bounds || !zoom) {
            return;
        }

        updateSvgSize();

        const transform = d3.zoomIdentity
            .translate(width / 2 - scale * bounds.centerX, height / 2 - scale * bounds.centerY)
            .scale(scale);

        suppressAutoFrameFit = true;

        svg.transition()
            .duration(durationMs)
            .call(zoom.transform, transform)
            .on("end", function() {
                suppressAutoFrameFit = false;
            });
    }

    function fitGraphToView(durationMs) {
        const bounds = getGraphBounds();

        if (!bounds || !zoom) {
            return;
        }

        updateSvgSize();

        const graphWidth = Math.max(bounds.width + nodeRadius * 3, 1);
        const graphHeight = Math.max(bounds.height + nodeRadius * 3, 1);

        const scale = Math.max(
            0.08,
            Math.min(
                3,
                0.9 / Math.max(graphWidth / width, graphHeight / height)
            )
        );

        centerGraphAtScale(scale, durationMs);
    }

    function fitFrameToCurrentGraph(durationMs) {
        const bounds = getGraphBounds();

        if (!bounds || !zoom) {
            return;
        }

        const currentScale = Math.max(0.08, currentTransform.k || 1);
        const parentWidth = container.parentElement.clientWidth;
        const padding = 100;

        const requiredWidth = Math.ceil(bounds.width * currentScale + padding);
        const requiredHeight = Math.ceil(bounds.height * currentScale + padding);

        const newWidth = Math.max(360, Math.min(parentWidth, requiredWidth));
        const newHeight = Math.max(320, Math.min(1400, requiredHeight));

        container.style.width = `${newWidth}px`;
        container.style.height = `${newHeight}px`;

        // Wait for CSS transition/layout, then update SVG and re-centre without changing zoom scale.
        suppressAutoFrameFit = true;

        setTimeout(function() {
            updateSvgSize();
            centerGraphAtScale(currentScale, durationMs);

            setTimeout(function() {
                suppressAutoFrameFit = false;
            }, durationMs + 50);
        }, 240);
    }

    function resetZoom() {
        if (!zoom) return;

        suppressAutoFrameFit = true;

        container.style.width = "100%";
        container.style.height = "620px";

        setTimeout(function() {
            updateSvgSize();

            svg.transition()
                .duration(350)
                .call(zoom.transform, d3.zoomIdentity)
                .on("end", function() {
                    suppressAutoFrameFit = false;
                });
        }, 240);
    }

    function zoomBy(factor) {
        if (!zoom) return;

        const oldScale = currentTransform.k || 1;

        svg.transition()
            .duration(250)
            .call(zoom.scaleBy, factor)
            .on("end", function() {
                const newScale = currentTransform.k || 1;

                if (newScale < oldScale - 0.01) {
                    fitFrameToCurrentGraph(180);
                }
            });
    }

    function redrawAndFit() {
        draw();
        setTimeout(function() {
            fitGraphToView(250);
        }, 250);
    }

    return {
        draw,
        fitGraphToView,
        fitFrameToCurrentGraph,
        resetZoom,
        zoomBy,
        redrawAndFit
    };
}


function enableCustomResizeHandle() {
    const container = document.getElementById("graph-container");
    const handle = document.getElementById("graph-resize-handle");

    if (!container || !handle) {
        return;
    }

    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let resizing = false;

    function startResize(event) {
        event.preventDefault();
        event.stopPropagation();

        resizing = true;
        startX = event.clientX;
        startY = event.clientY;
        startWidth = container.offsetWidth;
        startHeight = container.offsetHeight;

        document.body.style.userSelect = "none";
        document.body.style.cursor = "nwse-resize";

        window.addEventListener("pointermove", resize);
        window.addEventListener("pointerup", stopResize);
    }

    function resize(event) {
        if (!resizing) {
            return;
        }

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        const parentWidth = container.parentElement.clientWidth;
        const newWidth = Math.max(360, Math.min(parentWidth, startWidth + dx));
        const newHeight = Math.max(320, Math.min(1400, startHeight + dy));

        container.style.width = `${newWidth}px`;
        container.style.height = `${newHeight}px`;
    }

    function stopResize() {
        if (!resizing) {
            return;
        }

        resizing = false;

        document.body.style.userSelect = "";
        document.body.style.cursor = "";

        window.removeEventListener("pointermove", resize);
        window.removeEventListener("pointerup", stopResize);

        if (graphRenderer) {
            graphRenderer.redrawAndFit();
        }
    }

    handle.addEventListener("pointerdown", startResize);
}


document.addEventListener("DOMContentLoaded", function() {
    graphRenderer = createGraphRenderer();

    if (!graphRenderer) {
        return;
    }

    graphRenderer.draw();
    enableCustomResizeHandle();

    const resetButton = document.getElementById("resetZoomButton");
    if (resetButton) {
        resetButton.onclick = function() {
            graphRenderer.resetZoom();
        };
    }

    const fitButton = document.getElementById("fitGraphButton");
    if (fitButton) {
        fitButton.onclick = function() {
            graphRenderer.fitGraphToView(350);
        };
    }

    const fitFrameButton = document.getElementById("fitFrameButton");
    if (fitFrameButton) {
        fitFrameButton.onclick = function() {
            graphRenderer.fitFrameToCurrentGraph(250);
        };
    }

    const zoomInButton = document.getElementById("zoomInButton");
    if (zoomInButton) {
        zoomInButton.onclick = function() {
            graphRenderer.zoomBy(1.25);
        };
    }

    const zoomOutButton = document.getElementById("zoomOutButton");
    if (zoomOutButton) {
        zoomOutButton.onclick = function() {
            graphRenderer.zoomBy(0.8);
        };
    }
});
