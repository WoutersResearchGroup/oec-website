import React, {Component} from "react";
import axios from "axios";
import numeral from "numeral";
import classnames from "classnames";
import {connect} from "react-redux";
import {browserHistory} from "react-router";
import {withNamespaces} from "react-i18next";
import {formatAbbreviate} from "d3plus-format";
import {
  Radio,
  RadioGroup,
  Slider,
  RangeSlider,
  Button,
  ButtonGroup,
  Icon
} from "@blueprintjs/core";

import "./Rankings.css";

import OECNavbar from "components/OECNavbar";
import Footer from "components/Footer";
import Loading from "components/Loading";
import RankingTable from "components/RankingTable";

import {keyBy} from "helpers/funcs";
import {range} from "helpers/utils";

class Rankings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      catValue: "country",
      depthValue: "HS4",
      revValue: "HS92",
      initialYear: {HS92: 1995, HS96: 1998, HS02: 2003, HS07: 2008, HS12: 2012},
      yearValue: 2017,
      yearRange: [2012, 2017],
      exportThreshold: 100000000,
      data: null,
      columns: null,
      _loading: false,
      _yearSelection: "single"
    };
  }

  createColumns(type, array) {
    const years = type === "single" ? [array, array] : array;
    const columns = [
      {
        id: "id",
        Header: "",
        className: "col-id",
        Cell: props => props.index + 1,
        width: 40,
        sortable: false
      },
      {
        id: "category",
        accessor: d => d.Country,
        Header: () =>
          <div className="header">
            <span className="year">Country</span>
            <div className="icons">
              <Icon icon={"caret-up"} iconSize={16} />
              <Icon icon={"caret-down"} iconSize={16} />
            </div>
          </div>,
        style: {whiteSpace: "unset"},
        Cell: props =>
          <div className="category">
            <img
              src={`/images/icons/country/country_${props.original["Country ID"].substr(
                props.original["Country ID"].length - 3
              )}.png`}
              alt="icon"
              className="icon"
            />
            <a
              href={`/en/profile/country/${props.original["Country ID"].substr(
                props.original["Country ID"].length - 3
              )}`}
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="name">{props.original.Country}</div>
              <Icon icon={"chevron-right"} iconSize={14} />
            </a>
          </div>

      },
      ...range(years[0], years[1]).map((year, index, {length}) => ({
        id: length === index + 1 ? "lastyear" : `year${index}`,
        Header: () =>
          <div className="header">
            <span className="year">{year}</span>
            <div className="icons">
              <Icon icon={"caret-up"} iconSize={16} />
              <Icon icon={"caret-down"} iconSize={16} />
            </div>
          </div>,
        accessor: d => d["Trade Value ECI"],
        Cell: props =>
          numeral(props.original["Trade Value ECI"]).format("0.00000") * 1 !== 0
            ? numeral(props.original["Trade Value ECI"]).format("0.00000")
            : "",
        className: "year"
      }))
    ];

    return columns.filter(f => f !== null);
  }

  handleValueChange(key, value) {
    this.setState({[key]: value});
  }

  getChangeHandler(key) {
    return value => this.setState({[key]: value});
  }

  renderExportThresholdLabel(val) {
    return `$${formatAbbreviate(val)}`;
  }

  recalculateData() {
    const {
      catValue,
      depthValue,
      revValue,
      yearValue,
      yearRange,
      exportThreshold,
      _yearSelection
    } = this.state;
    this.setState({_loading: true});

    if (_yearSelection === "single") {
      let path =
        catValue === "country"
          ? path = `/api/stats/eci?cube=trade_i_baci_a_${revValue.substr(2)}&rca=Exporter+Country,${depthValue},Trade+Value&alias=Country,${depthValue}&Year=${yearValue}&parents=true&threshold_Country=${exportThreshold}`
          : path = `/api/stats/eci?cube=trade_i_baci_a_${revValue.substr(2)}&rca=${depthValue},Exporter+Country,Trade+Value&alias=${depthValue},Country&Year=${yearValue}&parents=true&threshold_Country=${exportThreshold}&iterations=21`;

      axios.all([axios.get(path)]).then(
        axios.spread(resp => {
          const data = resp.data.data.sort(
            (a, b) => b["Trade Value ECI"] - a["Trade Value ECI"]
          );
          const columns = this.createColumns(_yearSelection, yearValue);
          console.log(columns);
          this.setState({
            data,
            columns,
            _loading: false
          });
        })
      );
    }
    else {
      const data = [];
      range(yearRange[0], yearRange[1]).map(year => {
        let path =
          catValue === "country"
            ? path = `/api/stats/eci?cube=trade_i_baci_a_${revValue.substr(2)}&rca=Exporter+Country,${depthValue},Trade+Value&alias=Country,${depthValue}&Year=${year}&parents=true&threshold_Country=${exportThreshold}`
            : path = `/api/stats/eci?cube=trade_i_baci_a_${revValue.substr(2)}&rca=${depthValue},Exporter+Country,Trade+Value&alias=${depthValue},Country&Year=${year}&parents=true&threshold_Country=${exportThreshold}&iterations=21`;
        axios.all([axios.get(path)]).then(
          axios.spread(resp => {
            const yeardata = resp.data.data.sort(
              (a, b) => b["Trade Value ECI"] - a["Trade Value ECI"]
            );
            console.log(year, yeardata, path);
          })
        );
      });
      this.setState({
        _loading: false
      });
    }
  }

  render() {
    const {
      catValue,
      depthValue,
      revValue,
      initialYear,
      yearValue,
      yearRange,
      exportThreshold,
      data,
      columns,
      _loading,
      _yearSelection
    } = this.state;

    const depthButtons = ["HS2", "HS4", "HS6"];
    const revisionButtons = ["HS92", "HS96", "HS02", "HS07", "HS12"];
    console.log(
      catValue,
      depthValue,
      revValue,
      initialYear[revValue],
      _yearSelection === "single" ? yearValue : yearRange,
      exportThreshold
    );
    return (
      <div className="rankings-page">
        <OECNavbar />

        <div className="rankings-content">
          <h1 className="title">Dynamic Rankings</h1>
          <div className="about">
            <p>
              The Economic Complexity Index (ECI) and the Product Complexity Index (PCI)
              are, respectively, measures of the relative knowledge intensity of an
              economy or a product. ECI measures the knowledge intensity of an economy by
              considering the knowledge intensity of the products it exports. PCI measures
              the knowledge intensity of a product by considering the knowledge intensity
              of its exporters. This circular argument is mathematically tractable and can
              be used to construct relative measures of the knowledge intensity of
              economies and products (see {" "}
              <a
                href="/en/resources/methodology/"
                className="link"
                target="_blank"
                rel="noopener noreferrer"
              >
                methodology section
              </a>{" "}
              for more details).
            </p>
            <p>
              ECI has been validated as a relevant economic measure by showing its ability
              to predict future economic growth (see {" "}
              <a
                href="http://www.pnas.org/content/106/26/10570.short"
                className="link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hidalgo and Hausmann 2009
              </a>), and explain international variations in income inequality (see {" "}
              <a
                href="/pdf/LinkingEconomicComplexityInstitutionsAndIncomeInequality.pdf"
                className="link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hartmann et al. 2017
              </a>).
            </p>
            <p>This page includes rankings using the Economic Complexity Index (ECI).</p>
          </div>

          <div className="settings">
            <div className="button-settings">
              <div className="category-settings">
                <h3>Category </h3>
                <RadioGroup
                  onChange={event => {
                    this.handleValueChange("catValue", event.currentTarget.value);
                  }}
                  selectedValue={catValue}
                >
                  <Radio label="Country" value="country" />
                  <Radio label="Product" value="product" disabled={true} />
                </RadioGroup>
              </div>
              <div className="depth-settings">
                <h3>Depth </h3>
                <ButtonGroup style={{minWidth: 200}}>
                  {depthButtons.map((d, k) =>
                    <Button
                      key={k}
                      onClick={() => this.handleValueChange("depthValue", d)}
                      className={`${depthValue === d ? "is-active" : ""}`}
                    >
                      {d}
                    </Button>
                  )}
                </ButtonGroup>
              </div>
              <div className="revision-setting">
                <h3>Revision </h3>
                <ButtonGroup style={{minWidth: 200}}>
                  {revisionButtons.map((d, k) =>
                    <Button
                      key={k}
                      onClick={() => this.handleValueChange("revValue", d)}
                      className={`${revValue === d ? "is-active" : ""}`}
                    >
                      {d}
                    </Button>
                  )}
                </ButtonGroup>
              </div>
            </div>
            <div className="slider-settings">
              <div className="year-settings">
                <RadioGroup
                  onChange={event => {
                    this.handleValueChange("_yearSelection", event.currentTarget.value);
                  }}
                  selectedValue={_yearSelection}
                  inline={true}
                >
                  <Radio label="Single-Year" value="single" />
                  <Radio label="Multi-Year" value="multi" />
                </RadioGroup>
                {_yearSelection === "single" &&
                  <Slider
                    min={initialYear[revValue]}
                    max={2017}
                    stepSize={1}
                    labelStepSize={1}
                    onChange={this.getChangeHandler("yearValue")}
                    value={yearValue}
                    showTrackFill={false}
                  />
                }
                {_yearSelection === "multi" &&
                  <RangeSlider
                    min={initialYear[revValue]}
                    max={2017}
                    stepSize={1}
                    labelStepSize={1}
                    onChange={this.getChangeHandler("yearRange")}
                    value={yearRange}
                  />
                }
              </div>
              <div className="export-settings">
                <h3>Export Value Threshold </h3>
                <Slider
                  min={0}
                  max={1000000000}
                  stepSize={50000000}
                  labelStepSize={100000000}
                  onChange={this.getChangeHandler("exportThreshold")}
                  labelRenderer={this.renderExportThresholdLabel}
                  value={exportThreshold}
                />
              </div>
            </div>
            <div className="calculate-button">
              <Button onClick={() => this.recalculateData()}>Calculate</Button>
            </div>
          </div>
          <div className="ranking">
            {_loading
              ? <Loading />
              :               data && <RankingTable data={data} columns={columns} />
            }
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default withNamespaces()(connect()(Rankings));
