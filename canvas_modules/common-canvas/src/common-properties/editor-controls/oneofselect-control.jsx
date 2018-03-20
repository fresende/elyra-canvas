/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2016, 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/* eslint max-depth: ["error", 5] */

import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import Dropdown from "react-dropdown";
import EditorControl from "./editor-control.jsx";
import { ControlType } from "../constants/form-constants";

export default class OneofselectControl extends EditorControl {
	constructor(props) {
		super(props);
		this.state = {
			clippedClassName: ""
		};
		this.emptyLabel = "...";
		if (props.control.additionalText) {
			this.emptyLabel = props.control.additionalText;
		}
		this.handleChange = this.handleChange.bind(this);
		this.genSchemaSelectOptions = this.genSchemaSelectOptions.bind(this);
		this.genSelectOptions = this.genSelectOptions.bind(this);
		this.onBlur = this.onBlur.bind(this);
	}

	componentDidMount() {
		if (this.clearCurrentValue) {
			this.clearCurrentValue = false;
			this.props.controller.updatePropertyValue(this.props.propertyId, "");
		}
	}

	handleChange(evt) {
		let value = evt.value;
		// shouldn't have to do this but when "" or null the label is returned instead of value
		if (this.props.control.valueLabels) {
			for (let j = 0; j < this.props.control.valueLabels.length; j++) {
				if (this.props.control.valueLabels[j] === evt.label) {
					value = this.props.control.values[j];
					break;
				}
			}
		} else if (value === this.emptyLabel) {
			value = "";
		}
		this.props.controller.updatePropertyValue(this.props.propertyId, value);
	}
	onBlur() {
		this.props.controller.validateInput(this.props.propertyId);
	}
	// Added to prevent entire row being selected in table
	onClick(evt) {
		const me = ReactDOM.findDOMNode(this.refs.input);
		const myRect = me.getBoundingClientRect();

		// Required to prevent the dropdown menu from being clipped within table
		const dropdowns = me.getElementsByClassName("Dropdown-menu");
		if (dropdowns.length > 0) {
			const dropdownRect = me.getElementsByClassName("Dropdown-control")[0].getBoundingClientRect();
			const topPos = this._findTopPos(me, dropdownRect);
			if (topPos !== null) {
				const styles = "position: fixed; min-width: 200px; max-width: " + dropdownRect.width + "px; top: " + topPos + "px;";
				dropdowns[0].setAttribute("style", styles);
			} else {
				const parentRect = document.querySelector(".panel-container-open-right-flyout-panel").getBoundingClientRect();

				let clippedClassName = "";
				// 200 is the height of .Dropdown-menu in common-properties.css
				if (Math.abs((parentRect.top + parentRect.height) - (myRect.top + myRect.height)) < 200) {
					clippedClassName = "Dropdown-menu-clipped";
				}
				this.setState({ clippedClassName: clippedClassName });
			}
		}

		if (this.props.tableControl) {
			evt.stopPropagation();
		}
	}

	_findTopPos(me, dropdownRect) {
		let topPos = "";
		if (this.props.rightFlyout) {
			// dropdown control is in wide-flyout
			if (document.querySelector(".rightside-modal-container") !== null) {
				const modalRect = document.querySelector(".rightside-modal-container").getBoundingClientRect();
				topPos = dropdownRect.bottom - modalRect.top;
			} else { // dropdown control is in flyout, not within the wide-flyout
				let tableParent = false;
				let elem = me.parentElement;
				while (!tableParent) {
					if (elem.parentElement.id && elem.parentElement.id === "flexible-table-container") {
						// dropdown control is in flyout as a standalone control, outside a table
						topPos += 50;
						tableParent = true;
					}
					elem = elem.parentElement;
					if (elem.parentElement === null) {
						break;
					}
				}

				// dropdown control is not in table
				if (!tableParent) {
					topPos = null;
				}
			}
		} else { // dropdown control is in modal dialog
			const modal = document.querySelector(".modal-content");
			topPos = dropdownRect.bottom;

			if (modal !== null) {
				const modalRect = modal.getBoundingClientRect();
				topPos -= modalRect.top;
			}
		}
		return topPos;
	}

	genSchemaSelectOptions(selectedValue) {
		const schemaNames = this.props.controller.getDatasetMetadataSchemas();
		const options = [];
		// allow for user to not select a schema
		options.push({
			value: "",
			label: this.emptyLabel
		});
		if (Array.isArray(schemaNames)) {
			for (const schemaName of schemaNames) {
				options.push({
					value: schemaName,
					label: schemaName
				});
			}
		}
		const selectedOption = this.getSelectedOption(options, selectedValue);
		return {
			options: options,
			selectedOption: selectedOption
		};
	}

	genSelectOptions(selectedValue) {
		const options = [];
		// Allow for enumeration replacement
		const controlOpts = this.props.controller.getFilteredEnumItems(this.props.propertyId, this.props.control);
		for (let j = 0; j < controlOpts.values.length; j++) {
			options.push({
				value: controlOpts.values[j],
				label: controlOpts.valueLabels[j]
			});
		}
		const selectedOption = this.getSelectedOption(options, selectedValue);
		if (selectedValue && typeof selectedOption === "undefined") {
			this.clearCurrentValue = true;
		}
		return {
			options: options,
			selectedOption: selectedOption
		};
	}

	getSelectedOption(options, selectedValue) {
		const selectedOption = options.find(function(option) {
			return option.value === selectedValue;
		});
		return selectedOption;
	}

	render() {
		const controlValue = this.props.controller.getPropertyValue(this.props.propertyId);
		const conditionProps = {
			propertyId: this.props.propertyId,
			controlType: "dropdown"
		};
		const conditionState = this.getConditionMsgState(conditionProps);

		const errorMessage = this.props.tableControl ? null : conditionState.message;
		const messageType = conditionState.messageType;
		const icon = this.props.tableControl ? <div /> : conditionState.icon;
		const stateDisabled = conditionState.disabled;
		const stateStyle = conditionState.style;

		let controlIconContainerClass = "control-icon-container";
		if (messageType !== "info") {
			controlIconContainerClass = "control-icon-container-enabled";
		}

		let dropDown;
		if (this.props.control.controlType === ControlType.SELECTSCHEMA) {
			dropDown = this.genSchemaSelectOptions(controlValue);
		} else {
			dropDown = this.genSelectOptions(controlValue);
		}
		return (
			<div id="oneofselect-control-container">
				<div id={controlIconContainerClass}>
					<div>
						<div onClick={this.onClick.bind(this)} className={"Dropdown-control-panel " + this.state.clippedClassName} style={stateStyle}>
							<Dropdown {...stateDisabled}
								id={this.getControlID()}
								name={this.props.control.name}
								options={dropDown.options}
								onChange={this.handleChange}
								onBlur={this.onBlur}
								value={dropDown.selectedOption}
								placeholder={this.emptyLabel}
								ref="input"
							/>
						</div>
					</div>
					{icon}
				</div>
				{errorMessage}
			</div>
		);
	}
}

OneofselectControl.propTypes = {
	control: PropTypes.object.isRequired,
	propertyId: PropTypes.object.isRequired,
	controller: PropTypes.object.isRequired,
	tableControl: PropTypes.bool,
	rightFlyout: PropTypes.bool
};
