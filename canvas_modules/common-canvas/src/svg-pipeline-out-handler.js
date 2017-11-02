/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

export default class SVGPipelineOutHandler {

	static modifyPipelineWithCanvasInfo(pipeline, canvasInfo) {
		return Object.assign({}, pipeline, {
			id: canvasInfo.sub_id,
			nodes: this.getNodes(pipeline, canvasInfo),
			app_data: this.getPipelineAppData(pipeline.app_data, canvasInfo) });
	}

	static getNodes(pipeline, canvasInfo) {
		var newNodes = [];
		pipeline.nodes.forEach((pNode) => {
			var index = canvasInfo.nodes.findIndex((ciNode) => ciNode.id === pNode.id);
			if (index > -1) {
				var newNode;
				if (pNode.type === "binding") {
					newNode = Object.assign({}, pNode, {
						app_data: this.getNodeAppData(pNode.app_data, canvasInfo.nodes[index]) });
					if (pNode.input) {
						newNode = Object.assign({}, newNode, {
							input: this.getInput(pNode.input, canvasInfo.links, pNode.id) });
					}
				} else {
					newNode = Object.assign({}, pNode, {
						app_data: this.getNodeAppData(pNode.app_data, canvasInfo.nodes[index]) });
					if (pNode.inputs) {
						newNode = Object.assign({}, newNode, {
							inputs: this.getInputs(pNode.inputs, canvasInfo.links, pNode.id) });
					}
					if (canvasInfo.nodes[index].parameters) { // Only non-binding nodes have parameters
						newNode = Object.assign({}, newNode, {
							parameters: this.getParameters(canvasInfo.nodes[index].parameters) });
					}
				}
				newNodes.push(newNode);
			}
		});

		canvasInfo.nodes.forEach((ciNode) => {
			var index = pipeline.nodes.findIndex((pNode) => ciNode.id === pNode.id);
			if (index === -1) {
				var newNode = this.createNode(ciNode, canvasInfo.links);
				newNodes.push(newNode);
			}
		});

		return newNodes;
	}

	static getNodeAppData(appData, ciNode) {
		if (appData) {
			return Object.assign({}, appData, { ui_data: this.getNodeUiData(appData.ui_data, ciNode) });
		}
		return { ui_data: { x_pos: ciNode.x_pos, y_pos: ciNode.y_pos } };
	}

	static getNodeUiData(uiData, ciNode) {
		if (uiData) {
			return Object.assign({}, uiData, { x_pos: ciNode.x_pos, y_pos: ciNode.y_pos, messages: ciNode.messages });
		}
		return { x_pos: ciNode.x_pos, y_pos: ciNode.y_pos, messages: ciNode.messages };
	}

	static getInput(input, canvasLinks, pNodeId) {
		return Object.assign({}, input, { link: this.getLink(input.link, canvasLinks, pNodeId, input.id) });
	}

	static getLink(nodeLink, canvasLinks, pNodeId, pPortId) {
		var filteredCanvasLinks = this.getFilteredCanvasLinks(canvasLinks, pNodeId, pPortId, 0); // 0 indictaes there is only one port

		if (filteredCanvasLinks.length === 0) {
			return {};
		}

		if (nodeLink.node_ref_id === filteredCanvasLinks[0].srcNodeId &&
				nodeLink.port_ref_id === filteredCanvasLinks[0].srcNodePortId) {
			return nodeLink;
		}

		var newNodeLink = Object.assign({}, nodeLink, {
			node_id_ref: filteredCanvasLinks[0].srcNodeId,
			port_id_ref: filteredCanvasLinks[0].srcNodePortId
		});

		if (filteredCanvasLinks[0].class_name) {
			newNodeLink.app_data = this.getLinkAppData(nodeLink.app_data, filteredCanvasLinks[0]);
		}

		return newNodeLink;
	}

	static getLinkAppData(appData, link) {
		if (appData) {
			return Object.assign({}, appData, { ui_data: this.getLinkUiData(appData.ui_data, link) });
		}
		return { ui_data: { class_name: link.class_name } };
	}

	static getLinkUiData(uiData, link) {
		if (uiData) {
			return Object.assign({}, uiData, { class_name: link.class_name });
		}
		return { class_name: link.class_name };
	}

	static getInputs(inputs, canvasLinks, pNodeId) {
		return inputs.map((input, portIndex) =>
			Object.assign({}, input, { links: this.getLinks(input.links, canvasLinks, pNodeId, input.id, portIndex) })
		);
	}

	static getParameters(parameters) {
		return Object.assign({}, parameters);
	}

	// Returns the links that point to the target node info passed in.
	static getLinks(nodeLinks, canvasLinks, pNodeId, pPortId, portIndex) {
		var newLinks = [];

		// First get the subset of the links that are applicable to the target node info.
		var filteredCanvasLinks = this.getFilteredCanvasLinks(canvasLinks, pNodeId, pPortId, portIndex);

		// Loop through each filtered link and see if that link already has an
		// equivalent link in the set of links for the node. If it does we can
		// leave it 'as is' and just return it. If there is no equivalent link
		// wee need to create a new link to be returned.
		filteredCanvasLinks.forEach((filteredCanvasLink) => {
			var index = -1;
			if (nodeLinks) {
				index = nodeLinks.findIndex((nodeLink) => nodeLink.node_ref_id === filteredCanvasLink.srcNodeId && nodeLink.port_ref_id === filteredCanvasLink.srcNodePortId);
			}

			// If filteredLink does not match an existing link in the pipeline create a new link
			if (index === -1) {
				newLinks.push(this.createNewNodeLink(filteredCanvasLink));

			// If filteredLink matches an existing link in the pipeline just return it
			} else {
				newLinks.push(nodeLinks[index]);
			}
		});

		return newLinks;
	}

	// Returns the canvas links that are aplicable for the target node info passed in.
	static getFilteredCanvasLinks(canvasLinks, pNodeId, pPortId, portIndex) {
		return canvasLinks.filter((canvasLink) => {
			if (canvasLink.type === "nodeLink" &&
					canvasLink.trgNodeId === pNodeId) {
				if (canvasLink.trgNodePortId) {
					if (canvasLink.trgNodePortId === pPortId) {
						return true;
					}
				} else if (portIndex === 0) { // If port info is unknown make this link only for the first port
					return true;
				}
			}
			return false;
		});
	}

	static createNode(ciNode, canvasLinks) {
		var newNode = {
			id: ciNode.id,
			type: ciNode.type,
			op: ciNode.operator_id_ref,
			app_data: {
				ui_data: {
					image: ciNode.image,
					x_pos: ciNode.x_pos,
					y_pos: ciNode.y_pos,
					class_name: ciNode.class_name,
					messages: ciNode.messages,
					label: {
						default: ciNode.label
					}
				}
			}
		};

		if (ciNode.type === "binding") {
			if (ciNode.input_ports && ciNode.input_ports.length > 0) {
				newNode.input = this.createInput(ciNode, canvasLinks);
			}
			if (ciNode.output_ports && ciNode.output_ports.length > 0) {
				newNode.output = this.createOutput(ciNode);
			}
		} else {
			if (ciNode.input_ports && ciNode.input_ports.length > 0) {
				newNode.inputs = this.createInputs(ciNode, canvasLinks);
			}
			if (ciNode.output_ports && ciNode.output_ports.length > 0) {
				newNode.outputs = this.createOutputs(ciNode);
			}

			if (ciNode.parameters) {
				newNode.parameters = ciNode.parameters;
			}

			var newDecorations = this.createDecorations(ciNode.decorations);
			if (newDecorations.length > 0) {
				newNode.app_data.ui_data.decorations = newDecorations;
			}
		}

		return newNode;
	}

	static createDecorations(decorations) {
		var newDecorations = [];
		if (decorations) {
			decorations.forEach((decoration) => {
				newDecorations.push({
					position: decoration.position,
					class_name: decoration.class_name,
					hotspot: decoration.hotspot,
					id: decoration.id,
					image: decoration.image
				});
			});
		}
		return newDecorations;
	}

	static createInput(ciNode, canvasLinks) {
		var newInput = {
			id: ciNode.input_ports[0].id
		};

		if (ciNode.input_ports && ciNode.input_ports.length > 0) {
			newInput.app_data = {
				ui_data: {
					cardinality: ciNode.input_ports[0].cardinality, // There should be only one input_port for a binding ndoe
					label: {
						default: ciNode.input_ports[0].label
					}
				}
			};
		}

		canvasLinks.forEach((link) => {
			if (link.type === "nodeLink" &&
					link.trgNodeId === ciNode.id) {
				newInput.link = this.createNewNodeLink(link);
			}
		});
		return newInput;
	}

	static createOutput(ciNode) {
		var newOutput = {
			id: ciNode.output_ports[0].id
		};
		if (ciNode.output_ports && ciNode.output_ports.length > 0) {
			newOutput.app_data = {
				ui_data: {
					cardinality: ciNode.output_ports[0].cardinality, // There should be only one input_port for a binding ndoe
					label: {
						default: ciNode.output_ports[0].label
					}
				}
			};
		}
		return newOutput;
	}

	static createInputs(ciNode, canvasLinks) {
		var newInputs = [];
		ciNode.input_ports.forEach((inPort, portIndex) => {
			var newInput = {
				id: inPort.id,
				app_data: {
					ui_data: {
						cardinality: inPort.cardinality,
						class_name: inPort.class_name,
						label: {
							default: inPort.label
						}
					}
				}
			};

			var newLinks = this.createLinks(canvasLinks, ciNode.id, inPort.id, portIndex);
			if (newLinks.length > 0) {
				newInput.links = newLinks;
			}

			newInputs.push(newInput);
		});
		return newInputs;
	}

	static createLinks(canvasLinks, ciNodeId, inPortId, portIndex) {
		var newLinks = [];
		if (canvasLinks) {
			// Returns the canvas links that are aplicable for the target node info passed in.
			var filteredCanvasLinks = this.getFilteredCanvasLinks(canvasLinks, ciNodeId, inPortId, portIndex);

			filteredCanvasLinks.forEach((link) => {
				newLinks.push(this.createNewNodeLink(link));
			});
		}
		return newLinks;
	}

	static createOutputs(ciNode) {
		var newOutputs = [];
		ciNode.output_ports.forEach((outPort) => {
			var newOutput = {
				id: outPort.id,
				app_data: {
					ui_data: {
						cardinality: outPort.cardinality,
						class_name: outPort.class_name,
						label: {
							default: outPort.label
						}
					}
				}
			};

			newOutputs.push(newOutput);
		});
		return newOutputs;
	}

	static createNewNodeLink(link) {
		var newNodeLink = {
			node_id_ref: link.srcNodeId
		};

		if (link.class_name) {
			newNodeLink.app_data = {
				ui_data: {
					class_name: link.class_name
				}
			};
		}

		if (link.srcNodePortId) {
			newNodeLink.port_id_ref = link.srcNodePortId;
		}
		return newNodeLink;
	}

	static getPipelineAppData(appData, canvasInfo) {
		if (appData) {
			return Object.assign({}, appData, { ui_data: this.getPipelineUiData(appData.ui_data, canvasInfo) });
		}
		return { ui_data: { comments: this.getComments(canvasInfo) } };
	}

	static getPipelineUiData(uiData, canvasInfo) {
		if (uiData) {
			return Object.assign({}, uiData, { comments: this.getComments(canvasInfo) });
		}
		return { comments: this.getComments(canvasInfo) };
	}

	static getComments(canvasInfo) {
		return canvasInfo.comments.map((comment) =>
			({
				id: comment.id,
				x_pos: comment.x_pos,
				y_pos: comment.y_pos,
				width: comment.width,
				height: comment.height,
				class_name: comment.class_name,
				content: comment.content,
				associated_id_refs: this.getCommentLinks(canvasInfo, comment.id)
			})
		);
	}

	static getCommentLinks(canvasInfo, commentId) {
		var newLinks = [];
		canvasInfo.links.forEach((link) => {
			if (link.type === "commentLink" &&
					link.srcNodeId === commentId) {
				newLinks.push({ node_ref: link.trgNodeId, class_name: link.class_name });
			}
		});
		return newLinks;
	}
}
