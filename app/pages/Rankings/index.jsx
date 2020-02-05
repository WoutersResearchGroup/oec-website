import React from "react";
import axios from "axios";
import numeral from "numeral";
import classnames from "classnames";
import {connect} from "react-redux";
import {Helmet} from "react-helmet";
import {browserHistory} from "react-router";
import {withNamespaces} from "react-i18next";
import {Sparklines, SparklinesLine} from "react-sparklines";
import {AnchorButton, Button, ButtonGroup, Classes, Icon} from "@blueprintjs/core";

import "./Rankings.css";

import OECNavbar from "components/OECNavbar";
import Footer from "components/Footer";
import RankingTable from "components/RankingTable";

import {
  PAGE,
  CATEGORY_BUTTONS,
  PRODUCT_BUTTONS,
  FILTER_YEARS,
  DOWNLOAD_BUTTONS
} from "helpers/rankings";
import {keyBy} from "helpers/funcs";
import {range} from "helpers/utils";

class Rankings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: PAGE[0][this.props.params.category].title,
      text: PAGE[0][this.props.params.category].text,
      data: null,
      category: this.props.params.category || "country",
      measure: this.props.params.measure || "eci",
      filter: null
    };
  }

  createColumns(category, measure, filter) {
    const {lng} = this.props;
    const categoryHeader = category === "country" ? "Country" : "Product";
    const firstYear = filter.split("-")[0] * 1;
    const lastYear = filter.split("-")[1] * 1;

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
        accessor: d => category === "country" ? d.Country : d.HS6,
        Header: () =>
          <div className="header">
            <span className="year">{categoryHeader}</span>
            <div className="icons">
              <Icon icon={"caret-up"} iconSize={16} />
              <Icon icon={"caret-down"} iconSize={16} />
            </div>
          </div>,
        style: {whiteSpace: "unset"},
        Cell: props =>
          <div className="category">
            <img
              src={
                category === "country"
                  ? `/images/icons/country/country_${props.original["Icon ID"]}.png`
                  :                   `/images/icons/hs/hs_${props.original["Icon ID"]}.png`

              }
              alt="icon"
              className="icon"
            />
            <a
              href={
                category === "country"
                  ? `/${lng}/profile/country/${props.original["Icon ID"]}`
                  :                   `/${lng}/profile/${measure}/${props.original["HS6 ID"]}`

              }
              className="link"
            >
              <div className="name">
                {category === "country" ? props.original.Country : props.original.HS6}
              </div>
              <Icon icon={"chevron-right"} iconSize={14} />
            </a>
          </div>

      },
      ...range(firstYear, lastYear).map((year, index, {length}) => ({
        id: length === index + 1 ? "lastyear" : `year${index}`,
        Header: () =>
          <div className="header">
            <span className="year">{year}</span>
            <div className="icons">
              <Icon icon={"caret-up"} iconSize={16} />
              <Icon icon={"caret-down"} iconSize={16} />
            </div>
          </div>,
        accessor: d => d[`${year}`],
        Cell: props =>
          numeral(props.original[`${year}`]).format("0.00000") * 1 !== 0
            ? numeral(props.original[`${year}`]).format("0.00000")
            : "",
        width: 140,
        className: "year"
      })),
      category === "country"
        ? {
          id: "sparkline",
          Header: "",
          accessor: "sparkline",
          Cell: props =>
            <div>
              <Sparklines data={props.row.sparkline} limit={5} width={100} height={20}>
                <SparklinesLine color="white" style={{fill: "none"}} />
              </Sparklines>
            </div>,
          className: "sparkline",
          width: 220,
          sortable: false
        }
        : null
    ];

    return columns.filter(f => f !== null);
  }

  changeRange(category, measure, fltr) {
    const {lng} = this.props;
    const filter = fltr ? fltr : FILTER_YEARS[measure][FILTER_YEARS[measure].length - 1];
    const path = `/${lng}/rankings/${category}/${measure}/?year_range=${filter}`;

    browserHistory.push(path);
    this.setState({category, measure, filter});
  }

  componentDidMount() {
    const {category, measure} = this.state;

    const filter = FILTER_YEARS[measure].find(
      d => d === this.props.location.search.split("=")[1]
    );

    const futureData = FILTER_YEARS[measure].map(d => {
      const columns = this.createColumns(category, measure, d);
      const lastYear = d.split("-")[1] * 1;

      const path =
        category === "country"
          ? `/json/rankings/oec_eci_${d}.json`
          : `/json/rankings/oec_pci_hs6_${measure}_${d}.json`;

      return axios.get(path).then(resp => {
        category === "country"
          ? resp.data.map(d => d["Icon ID"] = d["Country ID"].slice(2))
          : resp.data.map(d => d["Icon ID"] = d["HS6 ID"].toString().slice(0, -6));
        resp.data.sort((a, b) => b[lastYear] - a[lastYear]);
        return {filter: d, data: resp.data, cols: columns};
      });
    });

    Promise.all(futureData).then(data =>
      this.setState({
        data: keyBy(data, "filter"),
        filter: filter || FILTER_YEARS[measure][FILTER_YEARS[measure].length - 1]
      })
    );
  }

  render() {
    const {title, text, data, category, measure, filter} = this.state;
    const {lng, t} = this.props;
    console.log("data", data);

    return (
      <div className="rankings-page">
        <Helmet>
          <title>{t(title)}</title>
        </Helmet>
        <OECNavbar />

        <div className="rankings-content">
          <h1 className="title">{t(title)}</h1>

          <div className="about">
            {text.map((d, k) =>
              <p
                className={"text"}
                key={`${k}`}
                dangerouslySetInnerHTML={{__html: t(d)}}
              />
            )}
          </div>

          <div className="download">
            {DOWNLOAD_BUTTONS.map((d, k, {length}) =>
              <AnchorButton
                text={d[0]}
                href={d[1][category]}
                key={k}
                className={classnames("anchor-button", {last: length === k + 1})}
              />
            )}
          </div>

          <div className="settings">
            <div className="setup showing">
              <div className="title">{t("Showing")}</div>
              <div className="buttons">
                <ButtonGroup style={{minWidth: 200}}>
                  {CATEGORY_BUTTONS.map((d, k) =>
                    <a
                      role="button"
                      className={classnames(`${Classes.BUTTON}`, {"is-active": d.value === category})}
                      key={k}
                      href={d.href}
                      tabIndex="0"
                      data-refresh="true"
                    >{d.display}</a>
                  )}
                </ButtonGroup>
              </div>
            </div>
            {category === "product" &&
              <div className="setup product">
                <div className="title">{t("Product Classification")}</div>
                <div className="buttons">
                  <ButtonGroup style={{minWidth: 200}}>
                    {PRODUCT_BUTTONS.map((d, k) =>
                      <a
                        role="button"
                        className={classnames(`${Classes.BUTTON}`, {"is-active": d.value === measure})}
                        key={k}
                        href={d.href}
                        tabIndex="0"
                        data-refresh="true"
                      >{d.display}</a>
                    )}
                  </ButtonGroup>
                </div>
              </div>
            }
            <div className="setup year">
              <div className="title">{t("Year Range")}</div>
              <div className="buttons">
                <ButtonGroup style={{minWidth: 200}}>
                  {FILTER_YEARS[measure] &&
                    FILTER_YEARS[measure].map((d, k) =>
                      <Button
                        key={k}
                        onClick={() => this.changeRange(category, measure, d)}
                        className={`${d === filter ? "is-active" : ""}`}
                      >
                        {d}
                      </Button>
                    )}
                </ButtonGroup>
              </div>
            </div>
          </div>

          <div className="ranking">
            {data &&
              <RankingTable
                data={data[filter].data}
                columns={data[filter].cols}
                length={data[filter].data.length}
              />
            }
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default withNamespaces()(connect()(Rankings));
