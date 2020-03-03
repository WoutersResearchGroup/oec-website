export const getVbTitle = (routeParams,
  selectedItemsCountry,
  selectedItemsPartner,
  selectedItemsProduct,
  selectedItemsTechnology,
  xScale,
  yScale) => {

  const {chart, flow, country, partner, viztype, time} = routeParams;
  const _countryNames = selectedItemsCountry.map(d => d.title).join(", ");
  const _partnerNames = selectedItemsPartner.map(d => d.title).join(", ");
  const _productNames = selectedItemsProduct.map(d => d.name).join(", ");
  const _technologyNames = selectedItemsTechnology.map(d => d.title).join(", ");

  const isTrade = new RegExp(/(export|import)/).test(flow);
  const isTimeSeriesChart = new RegExp(/(stacked|line)/).test(chart);
  const isCountry = new RegExp(/^(?!(all|show)).*$/).test(country);
  const isPartner = new RegExp(/^(?!(all|show)).*$/).test(partner);
  const isGeoGrouping = new RegExp(/show/).test(partner);
  const isProduct = new RegExp(/^(?!(all|show)).*$/).test(viztype);
  const isTradeBalance = flow === "show";

  const preps = {
    export: "to",
    import: "from",
    uspto: ""
  };

  let params = {
    country: _countryNames,
    partner: _partnerNames,
    flow,
    prep: preps[flow],
    product: _productNames,
    time: isTimeSeriesChart ? time.replace(".", "-") : time.split(".").sort((a, b) => a > b ? 1 : -1).join(", ")
  };

  let title = "vb_title_what_country_flow";

  if (chart === "network") {
    // Titles for Network section
    const networkTitleParams = {country: _countryNames, time};
    const networkTitleOptions = {
      export: ["vb_title_network_rca", networkTitleParams],
      pgi: ["vb_title_network_pgi", networkTitleParams],
      relatedness: ["vb_title_network_relatedness", networkTitleParams]
    };

    title = networkTitleOptions[flow][0] || networkTitleOptions.export[0];
    // params = networkTitleOptions[flow][1] || networkTitleOptions.export[1];
  }
  else if (chart === "rings") {
    title = "vb_title_rings";
    // params = {country: _countryNames, product: _productNames, time};
  }
  else if (chart === "scatter") {
    title = "vb_title_scatter";
    params = {measure: xScale.title, compare: yScale.title, time};
  }
  else if (isTradeBalance) {
    title = isPartner
      ? "vb_title_trade_balance_partner"
      : "vb_title_trade_balance";

    // params = isPartner ? {country: _countryNames, partner: _partnerNames, time} : {country: _countryNames, time};
  }
  else if (isTrade) {
    // Titles for Trade charts
    if (!isCountry && isProduct) {
      title = "vb_title_which_countries_flow_product";
      // params = {flow, product: _productNames, time};
    }
    else if (isGeoGrouping) {
      title = "vb_title_where_country_flow";
      // params = {country: _countryNames, flow, time, prep: preps[flow]};
    }
    else if (isCountry && isPartner) {
      title = "vb_title_what_country_flow_partner";
      // params = {country: _countryNames, partner: _partnerNames, flow, time};
    }
    else if (isCountry && isProduct) {
      title = "vb_title_where_country_flow_product";
      // params = {country: _countryNames, flow, time, product: _productNames, prep: preps[flow]};
    }
  }
  else {
    // Titles for Technology charts
    if (isCountry) {
      title = "vb_title_what_country_patent";
      // params = {country: _countryNames, time};
    }
    else if (!isCountry && isProduct) {
      title = "vb_title_which_countries_patent";
      // params = {names: _technologyNames, time};
    }
  }

  return {vbTitle: title, vbParams: params};
};
