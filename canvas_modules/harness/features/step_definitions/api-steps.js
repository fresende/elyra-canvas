/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/* eslint no-console: "off" */
/* global browser */

var nconf = require("nconf");
module.exports = function() {

	this.When(/^I enter "([^"]*)" into the Category id field$/, function(textboxValue) {
		var textbox = browser.$("#categoryId");
		textbox.setValue("", textboxValue);
	});

	this.When(/^I enter "([^"]*)" into the Category name field$/, function(textboxValue) {
		var textbox = browser.$("#categoryName");
		textbox.setValue("", textboxValue);
	});

	this.When(/^I enter "([^"]*)" into the new label field$/, function(textboxValue) {
		var textbox = browser.$("#newLabel");
		textbox.setValue("", textboxValue);
	});

	this.When("I call the API by clicking on the Submit button", function() {
		var submitButton = getAPISubmitButton();
		submitButton.click();
	});

	this.Then(/^I select node "([^"]*)" in the node drop-down list$/, function(nodeName) {
		// get the list of drop down options.
		browser.$("#sidepanel-api-nodePortLabel").scroll();
		browser.$("#sidepanel-api-nodePortLabel")
			.$$(".select")[0]
			.$(".button")
			.click("svg");
		// get the list of drop down options.
		var nodeList = browser.$("#sidepanel-api-nodePortLabel")
			.$$(".select")[0]
			.$(".select__options")
			.$$("button");
		for (var idx = 0; idx < nodeList.length; idx++) {
			if (nodeList[idx].getText() === nodeName) {
				nodeList[idx].click();
				break;
			}
		}
	});

	this.Then(/^I select port "([^"]*)" in the port drop-down list$/, function(portName) {
		// get the list of drop down options.
		browser.$("#sidepanel-api-nodePortLabel").scroll();
		browser.$("#sidepanel-api-nodePortLabel")
			.$$(".select")[1]
			.$(".button")
			.click("svg");
		// get the list of drop down options.
		var portList = browser.$("#sidepanel-api-nodePortLabel")
			.$$(".select")[1]
			.$(".select__options")
			.$$("button");
		for (var idx = 0; idx < portList.length; idx++) {
			if (portList[idx].getText() === portName) {
				portList[idx].click();
				break;
			}
		}
	});

	this.Then(/^I verify that "([^"]*)" was added in palette category "([^"]*)"$/, function(nodeTypeName, categoryName) {
		if (nconf.get("paletteLayout") === "Modal") {
			// select import categories
			var categoryElemModal = findCategoryElementModal(categoryName);
			expect(categoryElemModal).not.toEqual(null);
			categoryElemModal.click();

			const nodeIndexModal = findNodeIndexModal(nodeTypeName);
			expect(nodeIndexModal).not.toEqual(-1);
		} else {
			var categoryElem = findCategoryElement(categoryName);
			expect(categoryElem).not.toEqual(null);
			categoryElem.click();
			// find node index
			const nodeIndex = findNodeIndex(nodeTypeName);
			expect(nodeIndex).not.toEqual(-1);
		}

	});

	this.When(/^I update the pipelineflow to add input and output ports to node "([^"]*)"$/, function(nodeName) {
		const textField = browser.$("#pipelineFlow");
		const pipelineFlow = JSON.parse(textField.getText());
		const nodeList = pipelineFlow.pipelines[0].nodes;
		const node = nodeList.find((nd) => nd.app_data.ui_data.label === nodeName);
		const newInputPort = {
			"id": "inPort2",
			"app_data": {
				"ui_data": {
					"cardinality": {
						"min": 0,
						"max": 1
					},
					"label": "Input Port2"
				}
			},
			"links": []
		};

		const newOutputPort = {
			"id": "outPort2",
			"app_data": {
				"ui_data": {
					"cardinality": {
						"min": 0,
						"max": -1
					},
					"label": "Output Port2"
				}
			}
		};

		node.inputs.push(newInputPort);
		node.outputs.push(newOutputPort);
		textField.setValue(JSON.stringify(pipelineFlow));
	});

	this.Then(/^I click on the toggle with label "([^"]*)" in the api sidepanel$/, function(toggleLabel) {
		const apiSidePanel = browser.$("#sidepanel-api-notificationMessages");
		const labels = apiSidePanel.$$("label");
		let toggleFound = false;
		for (const label of labels) {
			if (label.getAttribute("for") === toggleLabel) {
				label.click();
				toggleFound = true;
				break;
			}
		}
		expect(toggleFound).toEqual(true);
	});

	this.Then(/^I have selected the "([^"]*)" message type in the api sidepanel$/, function(messageType) {
		const apiSidePanel = browser.$("#sidepanel-api-notificationMessages");
		const radioOptions = apiSidePanel.$$("div")[5].$$("label");

		try {
			if (messageType === "ready") {
				const ready = radioOptions[0];
				ready.scroll();
				browser.pause(500);
				ready.click();
			} else if (messageType === "warning") {
				const warning = radioOptions[1];
				warning.scroll();
				browser.pause(500);
				warning.click();
			} else if (messageType === "error") {
				const error = radioOptions[2];
				error.scroll();
				browser.pause(500);
				error.click();
			} else if (messageType === "other") {
				const other = radioOptions[3];
				other.scroll();
				browser.pause(500);
				other.click();
			}
		} catch (err) {
			console.log("Err = " + err);
			throw err;
		}
	});

	this.When(/^I enter "([^"]*)" into the message details field$/, function(textboxValue) {
		const apiSidePanel = browser.$("#sidepanel-api-notificationMessages");
		const textbox = apiSidePanel.$("#messageDetails");
		textbox.setValue("", textboxValue);
	});

	function getAPISubmitButton() {
		return browser.$("#canvasFileSubmit");
	}

	function findNodeIndexModal(nodeType) {
		var listItems = browser.$$(".palette-grid-node-text");
		for (var idx = 0; idx < listItems.length; idx++) {
			var nodeText = listItems[idx].getText();
			if (nodeText === nodeType) {
				return idx;
			}
		}
		return -1;
	}

	function findNodeIndex(nodeType) {
		var listItems = browser.$$(".palette-list-item");
		for (var idx = 0; idx < listItems.length; idx++) {
			var nodeText = listItems[idx].$(".palette-list-item-text-div").$(".palette-list-item-text-span")
				.getText();
			if (nodeText === nodeType) {
				return idx;
			}
		}
		return -1;
	}

	function findCategoryElement(nodeCategory) {
		for (var cat of browser.$$(".palette-flyout-category")) {
			if (cat.getValue() === nodeCategory) {
				return cat;
			}
		}
		return null;
	}

	function findCategoryElementModal(nodeCategory) {
		for (var cat of browser.$$(".palette-category")) {
			if (cat.getText() === nodeCategory) {
				return cat;
			}
		}
		return null;
	}

};
