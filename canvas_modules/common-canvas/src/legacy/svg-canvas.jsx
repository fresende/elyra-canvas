/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

import React from "react";
import PropTypes from "prop-types";
import { DRAG_LINK, DRAG_SELECT_REGION } from "../../constants/common-constants.js";

export default class SVGCanvas extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			dragging: false,
			dragMode: null,
			startX: 0,
			startY: 0,
			endX: 0,
			endY: 0
		};

		this.dragStart = this.dragStart.bind(this);
		this.drag = this.drag.bind(this);
		this.dragEnd = this.dragEnd.bind(this);

		this.notifyDragStart = this.notifyDragStart.bind(this);
		this.notifyDragOver = this.notifyDragOver.bind(this);
		this.notifyDragEnd = this.notifyDragEnd.bind(this);

		this.isDragging = this.isDragging.bind(this);
		this.getDragMode = this.getDragMode.bind(this);
		this.getDragBounds = this.getDragBounds.bind(this);
	}

	getDragMode() {
		return this.state.dragMode;
	}

	getDragBounds() {
		return {
			startX: this.state.startX,
			startY: this.state.startY,
			endX: this.state.endX,
			endY: this.state.endY
		};
	}

	notifyDragStart(dragMode, startX, startY) {
		this.setState({
			dragging: true,
			dragMode: dragMode,
			startX: startX,
			startY: startY,
			endX: startX,
			endY: startY
		});
	}

	notifyDragOver(latestX, latestY) {
		this.setState({ endX: latestX, endY: latestY });
	}

	notifyDragEnd() {
		this.setState({
			dragging: false,
			dragMode: null,
			startX: 0,
			startY: 0,
			endX: 0,
			endY: 0
		});
	}

	isDragging() {
		return this.state.dragging;
	}

	dragStart(ev) {
		// console.log("SVGCanvas.dragStart()");
		// console.log(ev);
	}

	drag(ev) {
		// console.log("SVGCanvas.drag()");
		// console.log(ev);
	}

	dragEnd(ev) {
		// console.log("SVGCanvas.dragEnd()");
		// console.log(ev);
	}

	render() {
		const viewLinks = [];
		// If necessary, draw the select region or link
		if (this.state.dragging) {
			if (this.state.dragMode === DRAG_SELECT_REGION) {
				const minX = Math.min(this.state.startX, this.state.endX);
				const minY = Math.min(this.state.startY, this.state.endY);
				const width = Math.abs(this.state.startX - this.state.endX);
				const height = Math.abs(this.state.startY - this.state.endY);
				viewLinks.push(
					<rect key={-1}
						x={minX}
						y={minY}
						width={width}
						height={height}
						className="selectLineStyle"
					/>);
			} else if (this.state.dragMode === DRAG_LINK) {
				viewLinks.push(
					<line key={-1}
						x1={this.state.startX}
						y1={this.state.startY}
						x2={this.state.endX}
						y2={this.state.endY}
						className="selectLineStyle"
					/>);
			}
		}

		return (
			<svg className="svg-canvas" {...this.props}>
				{viewLinks}
				{this.props.children}
			</svg>
		);
	}
}

SVGCanvas.propTypes = {
	children: PropTypes.element
};