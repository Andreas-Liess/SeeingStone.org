document.addEventListener("DOMContentLoaded", () => {
    const rawData = [
        {person: "You",
        // Bestehende Verbindungen
        rel1: "Co-led a project at Bain & Company designing ethical AI frameworks for financial services in New York.", conn1: "Sophie Carter",
        rel2: "Collaborated on student mentorship and research projects in AI ethics with Ethan Hall.", conn2: "Ethan Hall",
        rel3: "Guided family member Olivia Grant on math club activities and ethics discussions.", conn3: "Olivia Grant",
        rel4: "Professional identity shaped by leadership in AI ethics initiatives at Bain & Company.", conn4: "Bain & Company (Ai Transformation)",
        
        // NEU: Explizite Rückverbindungen, damit diese Linien BLAU werden
        rel5: "Coordinate regular family updates and shared responsibilities.", conn5: "Aiden Foster",
        rel6: "Followed up regarding transparent AI models after Munich meetup.", conn6: "Claude Junker",
        rel7: "Reviewed profile regarding AI ethics initiatives.", conn7: "Jane Doe" 
        },
        {person: "Sophie Carter",
        rel1: "Provided mentorship and career guidance to You, advising on consulting and AI ethics projects.", conn1: "You",
        rel2: "Mentored Ethan Hall in AI research methodologies and project management.", conn2: "Ethan Hall",
        rel3: "Mentored Noah Kim on AI ethics coursework and supervised his research projects.", conn3: "Noah Kim",
        rel4: "Fielded media inquiries from Mia Sanders (CampusTV) regarding AI ethics panels.", conn4: "Mia Sanders (CampusTV)"
        },
        {person: "Ethan Hall",
        rel1: "Worked closely with You on data analysis and AI ethics project reviews.", conn1: "You",
        rel2: "Collaborated with Noah Kim on student research assignments and joint presentations.", conn2: "Noah Kim",
        rel3: "Received coaching and project guidance from Sophie Carter.", conn3: "Sophie Carter",
        rel4: "Sent progress updates and draft reports to Sophie Carter for review.", conn4: "Sophie Carter"
        },
        {person: "Isabella Reed",
        rel1: "Coordinated logistics and project timelines with You for ethical AI research projects.", conn1: "You",
        rel2: "Communicated occasionally with Alex Jordan regarding project resources and schedules.", conn2: "Alex Jordan",
        rel3: "Collaborated with Sophie Carter on operational and organizational support for student projects.", conn3: "Sophie Carter"
        },
        {person: "Noah Kim",
        rel1: "Worked with You on AI ethics projects at New York research initiatives.", conn1: "You",
        rel2: "Collaborated with Ethan Hall on research projects and presentations.", conn2: "Ethan Hall",
        rel3: "Received mentorship and coaching from Sophie Carter on ethics research.", conn3: "Sophie Carter"
        },
        {person: "Olivia Grant",
        rel1: "Advised You on family-related math and ethics discussions and supported your mentoring of younger members.", conn1: "You",
        rel2: "Discussed project progress and family matters with Liam Brooks.", conn2: "Liam Brooks",
        rel3: "Shared insights and coordinated family activities with Grace Thompson.", conn3: "Grace Thompson",
        rel4: "Collaborated and exchanged ideas on projects and family responsibilities with Aiden Foster.", conn4: "Aiden Foster"
        },
        {person: "Liam Brooks",
        rel1: "Included Olivia Grant in family correspondence and project discussions.", conn1: "Olivia Grant",
        rel2: "Maintained communication with You for updates on family and shared projects.", conn2: "You"
        },
        {person: "Grace Thompson",
        rel1: "Included Olivia Grant in CC lists for family and project discussions.", conn1: "Olivia Grant",
        rel2: "Maintained connection with You on family matters and collaborative initiatives.", conn2: "You"
        },
        {person: "Aiden Foster",
        rel1: "Coordinated family discussions and shared responsibilities with Olivia Grant.", conn1: "Olivia Grant",
        rel2: "Maintained communication with You regarding shared family and project matters.", conn2: "You"
        },
        {person: "AliExpress",
        rel1: "Acted as a seller and buyer of Mini-PCs for You's research and personal use.", conn1: "You"
        },
        {person: "LinkedIn",
        rel1: "Served as You's login service provider and professional networking platform.", conn1: "You"
        },
        {person: "Börsenmedien AG",
        rel1: "Provided You with financial and market subscription services for professional research.", conn1: "You"
        },
        {person: "Bain & Company Karriere Team",
        rel1: "Acted as recruiting and career event contact for You at Bain & Company.", conn1: "You"
        },
        {person: "John Doe",
        rel1: "Admin of AI Founders EU Telegram group, connecting AI founders including You.", conn1: "You",
        rel2: "Indirect collaborator via forwarded pitch from Alex Jakarta and shared interests in AI ethics.", conn2: "Alex Jakarta"
        },
        {person: "Jane Doe",
        rel1: "Sent a LinkedIn coffee invite to You which remains unanswered, indicating interest in discussion of AI ethics.", conn1: "You",
        rel2: "Shares professional network overlap with John Doe in AI ethics initiatives, potentially facilitating introductions.", conn2: "John Doe"
        },
        {person: "Alex Jakarta",
        rel1: "Received Your pitch deck 'Conscience as Code' regarding AI ethics projects.", conn1: "You",
        rel2: "Forwarded the pitch to John Doe to initiate potential collaboration.", conn2: "John Doe",
        rel3: "Serves as VC contact reviewing ethical AI projects and funding opportunities.", conn3: "You"
        },
        {person: "Claude Junker",
        rel1: "Met You at Munich AI meetup discussing transparent and explainable AI models.", conn1: "You",
        rel2: "Mentioned You in the AI Founders EU Telegram group to highlight shared interests.", conn2: "You",
        rel3: "Engaged with You on shared interest in transparent AI research and practical implementations.", conn3: "You"
        }
    ];

    const nodes = [];
    const edges = [];
    const nodeSet = new Set();
    const nodeConnections = {};
    const edgeMap = new Map(); // Track all edges for bidirectionality detection
    
    // First pass: collect all nodes and edges
    rawData.forEach(row => {
        const source = row.person;
        if (!nodeSet.has(source)) {
            nodeSet.add(source);
            nodes.push({data: {id: source}});
            nodeConnections[source] = [];
        }
        for (let i = 1; i <= 10; i++) {
            const rel = row[`rel${i}`];
            const target = row[`conn${i}`];
            if (target && target !== "N/A") {
                if (!nodeSet.has(target)) {
                    nodeSet.add(target);
                    nodes.push({data: {id: target}});
                    nodeConnections[target] = [];
                }
                
                // Store edge and track in map
                const edgeKey = `${source}->${target}`;
                edgeMap.set(edgeKey, {source, target, label: rel});
                edges.push({data: {source, target, label: rel}});
                nodeConnections[source].push({target, relationship: rel});
            }
        }
    });
    
    // Detect bidirectional relationships with "You"
    const bidirectionalNodes = new Set();
    edgeMap.forEach((edge, key) => {
        const reverseKey = `${edge.target}->${edge.source}`;
        if (edgeMap.has(reverseKey)) {
            // Bidirectional relationship exists
            if (edge.source === "You") {
                bidirectionalNodes.add(edge.target);
            } else if (edge.target === "You") {
                bidirectionalNodes.add(edge.source);
            }
        }
    });
    
    // Classify nodes and add nodeType to data
    nodes.forEach(node => {
        const nodeId = node.data.id;
        if (nodeId === "You") {
            node.data.nodeType = "center";
        } else if (bidirectionalNodes.has(nodeId)) {
            node.data.nodeType = "strong";
        } else {
            node.data.nodeType = "weak";
        }
    });
    
    // Classify edges based on target node strength
    edges.forEach(edge => {
        const targetNode = nodes.find(n => n.data.id === edge.data.target);
        if (targetNode && targetNode.data.nodeType === "strong") {
            edge.data.edgeType = "strong";
        } else {
            edge.data.edgeType = "weak";
        }
    });

    const cy = cytoscape({
        container: document.getElementById('cy'),
        elements: {nodes, edges},
        minZoom: 0.5,
        maxZoom: 3.0,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': (ele) => {
                        const nodeType = ele.data('nodeType');
                        if (nodeType === 'center') return '#FF6600'; // Orange - You
                        if (nodeType === 'strong') return '#0088ff'; // Blue - Strong ties
                        return '#444444'; // Grey - Weak ties
                    },
                    'label': 'data(id)',
                    'color': '#ffffff',
                    'font-family': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                    'font-size': '11px',
                    'text-valign': 'bottom',
                    'text-margin-y': 8,
                    'width': 12,
                    'height': 12,
                    'border-width': 2,
                    'border-color': '#000',
                    'text-outline-width': 2,
                    'text-outline-color': '#0a0a0a'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': (ele) => {
                        const edgeType = ele.data('edgeType');
                        return edgeType === 'strong' ? 1.5 : 1;
                    },
                    'line-color': (ele) => {
                        const edgeType = ele.data('edgeType');
                        return edgeType === 'strong' ? '#ffffff' : '#333333';
                    },
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'none',
                    'opacity': 0.8
                }
            },
            {
                selector: '.highlighted',
                style: {
                    'background-color': '#ffffff',
                    'line-color': '#FF6600',
                    'width': 2,
                    'z-index': 999,
                    'text-opacity': 1,
                    'color': '#FF6600'
                }
            },
            {
                selector: '.dimmed',
                style: {'opacity': 0.2}
            }
        ],

        layout: {
            name: 'concentric',
            fit: true,
            padding: 50,
            minNodeSpacing: 80,
            concentric: function( node ){
                if(node.data('id') === 'You') return 10; 
                if(node.data('nodeType') === 'strong') return 5; 
                return 1;
            },
            levelWidth: function( nodes ){ return 2; }
        }
    });

    const infoPanel = document.getElementById('info-panel');
    infoPanel.innerHTML = '<div class="info-placeholder">Select node to inspect topology</div>';

    cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        const id = node.data('id');
        cy.elements().removeClass('highlighted dimmed');
        
        const connected = node.neighborhood().add(node);
        connected.addClass('highlighted');
        cy.elements().not(connected).addClass('dimmed');
        
        let html = `<div class="detail-name">${id}</div>`;
        const conns = nodeConnections[id] || [];
        if (conns.length > 0) {
            conns.forEach(c => {
                html += `<div class="connection-item"><span class="connection-target">${c.target}</span><span class="connection-label">${c.relationship}</span></div>`;
            });
        } else {
            html += `<div class="text-dim">No direct edges detected in current scope.</div>`;
        }
        infoPanel.innerHTML = html;
    });

    cy.on('tap', (evt) => {
        if (evt.target === cy) {
            cy.elements().removeClass('highlighted dimmed');
            infoPanel.innerHTML = '<div class="info-placeholder">Select node to inspect topology</div>';
        }
    });

    // Handle Resize for Responsive Layout
    window.addEventListener('resize', () => {
        cy.resize();
        cy.fit();
    });
});
