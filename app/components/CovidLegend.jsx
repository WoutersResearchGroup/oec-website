import React, {Component} from "react";
import {Position, Tooltip} from "@blueprintjs/core";

import "./CovidLegend.css";

class CovidLegend extends Component {
  render() {
    const {
      activeList,
      country,
      countryName,
      icon
    } = this.props;

    return (
      <div className="country-selector" onClick={() => this.props.onItemSelect(country)}>
        <Tooltip content={
          <div>
            <span>{countryName}</span>
          </div>} position={Position.TOP}>
          <img className="flag-icon" src={activeList.includes(country) ? icon : `${icon.slice(0, -4)}_gray.png`} />
        </Tooltip>
      </div>
    );
  }
}

export default CovidLegend;