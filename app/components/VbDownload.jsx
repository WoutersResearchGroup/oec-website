import React from "react";
import {Link} from "react-router";
import {withNamespaces} from "react-i18next";
import {
  Button,
  Drawer,
  InputGroup,
  RadioGroup,
  Radio,
  Position
} from "@blueprintjs/core";
import {event, select} from "d3-selection";
import {formatAbbreviate} from "d3plus-format";
import colors from "../helpers/colors";
import ReactTable from "react-table";
import {saveElement} from "d3plus-export";

import {saveAs} from "file-saver";
import JSZip from "jszip";
import {strip} from "d3plus-text";

import "./VbDownload.css";

const filename = str => strip(str.replace(/<[^>]+>/g, ""))
  .replace(/^\-/g, "")
  .replace(/\-$/g, "");

const getBackground = elem => {

  // Is current element's background color set?
  const color = select(elem).style("background-color");
  if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") return color;

  // if not: are you at the body element?
  if (elem === document.body) return "white";
  else return getBackground(elem.parentNode);

};

class VbShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      permalink: "",
      separator: ",",
      imageFormat: "svg",
      autoFocus: true,
      canEscapeKeyClose: true,
      canOutsideClickClose: true,
      enforceFocus: true,
      hasBackdrop: true,
      isOpen: false,
      position: Position.RIGHT,
      size: undefined,
      usePortal: true
    };
  }

  onCSV = () => {
    const {title} = this.props;
    const results = this.props.data;

    const rowDelim = "\r\n";
    const colDelim = this.state.separator;

    const columns = results && results[0] ? Object.keys(results[0]) : [];
    let csv = columns.map(val => `\"${val}\"`).join(colDelim);

    for (let i = 0; i < results.length; i++) {
      const data = results[i];

      csv += rowDelim;
      csv += columns.map(key => {

        const val = data[key];

        return typeof val === "number" ? val
          : val ? `\"${val}\"` : "";

      }).join(colDelim);
    }

    const zip = new JSZip();
    zip.file(`${filename(title)}.csv`, csv);
    zip.generateAsync({type: "blob"})
      .then(content => saveAs(content, `${filename(title)}.zip`));
  }

  onSave = () => {
    const {title} = this.props;
    const {backgroundColor, imageFormat} = this.state;
    this.setState({imageProcessing: true});

    let node = document.body.querySelector(".viz");
    if (node) {
      // config
      let background;
      if (backgroundColor) background = getBackground(node);

      // grab the d3plus visualization directly and save it as-is
      node = select(node).select(".d3plus-viz").node();
      saveElement(
        node,
        {filename: filename(title), type: imageFormat},
        {background, callback: () => this.setState({imageProcessing: false})}
      );

    }
    else {
      this.setState({imageProcessing: false});
    }
  }

  componentDidMount = () => {
    this.setState({permalink: window.location.href});
  }

  shouldComponentUpdate = (prevProps, prevState) => this.state.isOpen !== prevState.isOpen ||
  this.state.separator !== prevState.separator || this.state.imageFormat !== prevState.imageFormat;

  handleOpen = () => this.setState({isOpen: true});
  handleClose = () => {
    this.setState({isOpen: false});
  };

  handleSeparator = evt => this.setState({separator: evt.target.value});
  handleImageFormat = evt => (console.log(evt.target.value), this.setState({imageFormat: evt.target.value}));

  render() {
    const {separator} = this.state;
    const columnKeys = Object.keys(this.props.data[0]);
    const columns = columnKeys.map(d => ({Header: d, accessor: d}));

    return <div>
      <Button className="vb-chart-button-option" icon="import" text="Download" onClick={this.handleOpen} />
      <Drawer
        className={"vb-drawer"}
        icon={"import"}
        onClose={this.handleClose}
        title={"Download"}
        {...this.state}
      >
        <div className="bp3-drawer-body">
          <div className="vb-share-option">
            <h5 className="title">Preview data</h5>
            <ReactTable
              columns={columns}
              data={this.props.data.slice(0, 5)}
              defaultPageSize={5}
              showPagination={false}
            />
          </div>
          <div className="vb-share-option">
            <Button
              className="vb-chart-button-option"
              fontSize="md"
              icon="import"
              onClick={this.onCSV.bind(this)}
              text="Download CSV"
            />
          </div>
          <div className="vb-share-option">
            <RadioGroup
              label="Separator"
              className="vb-radiogroup"
              onChange={this.handleSeparator}
              selectedValue={separator}
              inline={true}
            >
              <Radio label="Colon" value="," />
              <Radio label="Semicolon" value=";" />
              <Radio label="Tab" value="\t" />
            </RadioGroup>
          </div>

          <div className="vb-share-option">
            <h5 className="title">Save visualization</h5>
            <Button
              className="save-image-download-button vb-chart-button-option"
              onClick={() => this.onSave()}
              rebuilding={this.state.imageProcessing}
              disabled={this.state.imageProcessing}
              icon={this.state.imageProcessing ? "cog" : "media"}
              fontSize="md"
              fill
            >
              {this.state.imageProcessing ? "Processing image" : `Download ${this.state.imageFormat.toUpperCase()}`}
            </Button>
          </div>

          <div className="vb-share-option">
            <RadioGroup
              label="Image Format"
              className="vb-radiogroup"
              onChange={this.handleImageFormat}
              selectedValue={this.state.imageFormat}
              inline={true}
            >
              <Radio label="PNG" value="png" />
              <Radio label="SVG" value="svg" />
            </RadioGroup>
          </div>



        </div>
      </Drawer>
    </div>;
  }
}

export default withNamespaces()(VbShare);