// Define namespace: dc = dataset comparison.
var dc = dc = dc || {};

dc.dataset_name = "";
dc.control_list_length = 0;
dc.results = [];
dc.methods = [];

// The chart type has been selected.
dc.onTypeSelect = function()
{
  var selectHolder = d3.select(".selectholder");
  selectHolder.append("label")
      .attr("for", "main_dataset_select")
      .attr("class", "main-dataset-select-label")
      .text("Select dataset:");
  selectHolder.append("select")
      .attr("id", "main_dataset_select")
      .attr("onchange", "dc.datasetSelect()");

  dc.listDatasets();
}

// List the datasets.
dc.listDatasets = function()
{
  var sqlstr = "SELECT datasets.name as dataset FROM datasets;";
  var results = dbExec(sqlstr);
  results = dbType === "sqlite" ? results[0].values : results;

  var dataset_select_box = document.getElementById("main_dataset_select");
  clearSelectBox(dataset_select_box);
  for (i = 0; i < results.length; i++)
  {
    var new_option = document.createElement("option");
    new_option.text = dbType === "sqlite" ? results[i][0] : results[i].dataset;
    dataset_select_box.add(new_option);
  }
  dataset_select_box.selectedIndex = -1;
}

// The user has selected a dataset.
dc.datasetSelect = function()
{
  var dataset_select_box = document.getElementById("main_dataset_select");
  dc.dataset_name = dataset_select_box.options[dataset_select_box.selectedIndex].text;

  // Create an empty chart.
  dc.clear();

  // Now create the legend at the bottom that will allow us to add/remove
  // methods.
  d3.selectAll(".legendholder").append("div").attr("class", "methodcontrol");

  d3.selectAll(".legendholder").append("input")
      .attr("type", "button")
      .attr("class", "add_method_button")
      .attr("onclick", "dc.clickAddButton()")
      .attr("value", "Add another method");
  d3.selectAll(".legendholder").append("input")
      .attr("type", "button")
      .attr("class", "clear_methods_button")
      .attr("onclick", "dc.clickClearMethods()")
      .attr("value", "Remove all methods");
  d3.selectAll(".legendholder").append("input")
      .attr("type", "button")
      .attr("class", "redraw_methods_button")
      .attr("onclick", "dc.clickRedrawMethods()")
      .attr("value", "Redraw graph");

  dc.control_list_length = 0;

  // Collect the results for lists of methods.
  var sqlstr = "SELECT DISTINCT methods.name as method, methods.parameters as parameter, libraries.name as lib FROM methods, results, datasets, libraries WHERE results.dataset_id = datasets.id AND results.method_id = methods.id AND datasets.name = '" + dc.dataset_name + "' AND libraries.id = results.libary_id ORDER BY methods.name;";
  dc.methods = dbExec(sqlstr);
  dc.methods = dbType === "sqlite" ? dc.methods[0].values : dc.methods;
}

// The user has requested to add a new thing.
dc.clickAddButton = function()
{
  var newmethodcontrol = d3.selectAll(".methodcontrol").append("div").attr("class", "methodcontroldiv");

  newmethodcontrol.append("label")
      .attr("class", "dc-index-label")
      .text(String(dc.control_list_length));
  newmethodcontrol.append("label")
      .attr("for", "method_select_" + String(dc.control_list_length))
      .attr("class", "dc-method-select-label")
      .text("Method:");
  newmethodcontrol.append("select")
      .attr("id", "method_select_" + String(dc.control_list_length))
      .attr("onchange", "dc.methodControlListSelect('" + String(dc.control_list_length) + "')");
  newmethodcontrol.append("label")
      .attr("for", "param_select_" + String(dc.control_list_length))
      .attr("class", "dc-param-select-label")
      .text("Parameters:");
  newmethodcontrol.append("select")
      .attr("id", "param_select_" + String(dc.control_list_length))
      .attr("onchange", "dc.paramControlListSelect('" + String(dc.control_list_length) + "')");
  newmethodcontrol.append("label")
      .attr("for", "library_select_" + String(dc.control_list_length))
      .attr("class", "dc-library-select-label")
      .text("Library:");
  newmethodcontrol.append("select")
      .attr("id", "library_select_" + String(dc.control_list_length));

  dc.control_list_length++;

  // Add list of methods.
  var newbox = document.getElementById("method_select_" + String(dc.control_list_length - 1));
  distinct_methods = dc.methods.map(function(d) { return dbType === "sqlite" ? d[0] : d.method; }).reduce(function(p, c) { if(p.indexOf(c) < 0) p.push(c); return p; }, []);
  for (i = 0; i < distinct_methods.length; i++)
  {
    var new_option = document.createElement("option");
    new_option.text = distinct_methods[i];
    newbox.add(new_option);
  }
  newbox.selectedIndex = -1;
}

dc.methodControlListSelect = function(id)
{
  var selectbox = document.getElementById("method_select_" + id);
  var method_name = selectbox.options[selectbox.selectedIndex].text;

  // Now we need to add parameters.
  distinct_parameters = dc.methods.map(function(d) { return d; }).reduce(function(p, c) { if((dbType === "sqlite" ? c[0] : c.method) != method_name) { return p; } else if(p.indexOf((dbType === "sqlite" ? c[1] : c.parameter)) < 0) { p.push((dbType === "sqlite" ? c[1] : c.parameter)); } return p; }, []);
  var parambox = document.getElementById("param_select_" + id);
  clearSelectBox(parambox);
  for (i = 0; i < distinct_parameters.length; i++)
  {
    var new_option = document.createElement("option");
    new_option.text = distinct_parameters[i];
    if (new_option.text == "") { new_option.text == "[no parameters]"; }
    parambox.add(new_option);
  }
  parambox.selectedIndex = -1;
}

dc.paramControlListSelect = function(id)
{
  var method_select_box = document.getElementById("method_select_" + id);
  var method_name = method_select_box.options[method_select_box.selectedIndex].text;
  var param_select_box = document.getElementById("param_select_" + id);
  var param_name = param_select_box.options[param_select_box.selectedIndex].text;
  if (param_name == "[no parameters]") { param_name = ""; }

  distinct_libraries = dc.methods.map(function(d) { return d; }).reduce(function(p, c) { if((dbType === "sqlite" ? c[0] : c.method) != method_name || (dbType === "sqlite" ? c[1] : c.parameter) != param_name) { return p; } else if(p.indexOf((dbType === "sqlite" ? c[2] : c.lib)) < 0) { p.push((dbType === "sqlite" ? c[2] : c.lib)); } return p; }, []);

  var library_select_box = document.getElementById("library_select_" + id);
  clearSelectBox(library_select_box);
  for(i = 0; i < distinct_libraries.length; i++)
  {
    var new_option = document.createElement("option");
    new_option.text = distinct_libraries[i];
    library_select_box.add(new_option);
  }
  library_select_box.selectedIndex = -1;
}

dc.clickClearMethods = function()
{
  d3.selectAll(".methodcontroldiv").remove();
  dc.control_list_length = 0;
  clearChart(); // Remove the chart too.
}

// The user wants a plot of everything we have.
dc.clickRedrawMethods = function()
{
  // We need to generate a big SQL query.
  var sqlstr = "";
  for (i = 0; i < dc.control_list_length; i++)
  {
    var methodbox = document.getElementById("method_select_" + String(i));
    var method_name = methodbox.options[methodbox.selectedIndex].text;
    var parambox = document.getElementById("param_select_" + String(i));
    var param_name = parambox.options[parambox.selectedIndex].text;
    if (param_name == "[no parameters]") { param_name = ""; }
    var librarybox = document.getElementById("library_select_" + String(i));
    var library_name = librarybox.options[librarybox.selectedIndex].text;

    sqlstr = sqlstr + "SELECT DISTINCT * FROM " +
      "(SELECT results.time as time, results.var as var, methods.name as method, methods.parameters as parameter, libraries.name as lib, " + String(i) + " AS sort, results.build_id as bid " +
      "FROM results, methods, libraries, datasets " +
      "WHERE results.libary_id = libraries.id AND libraries.name = '" + library_name + "' AND results.dataset_id = datasets.id AND datasets.name = '" + dc.dataset_name + "' AND results.method_id = methods.id AND methods.name = '" + method_name + "' AND methods.parameters = '" + param_name + "' " +
      "ORDER BY bid DESC " +
      ") tmp GROUP BY lib";

    if (i < dc.control_list_length - 1)
    {
      sqlstr = sqlstr + " UNION ";
    }
  }
  sqlstr = sqlstr + " ORDER BY sort ASC;";
  dc.results = dbExec(sqlstr);
  dc.results = dbType === "sqlite" ? dc.results[0].values : dc.results;

  dc.clearChart();
  dc.buildChart();
}

// Remove everything on the page that belongs to us.
dc.clear = function()
{
  d3.selectAll(".methodcontrol").remove();
  d3.selectAll(".add_method_button").remove();
  d3.selectAll(".clear_methods_button").remove();
  d3.selectAll(".redraw_methods_button").remove();

  dc.clearChart();
}

// Clear the chart.
dc.clearChart = function()
{
  d3.select("svg").remove();
  d3.selectAll(".d3-tip").remove();
}

// Build the chart and display it on screen.
dc.buildChart = function()
{
  dc.results = dc.results.map(function(d) {
  var runtime = dbType === "sqlite" ? d[0] : d.time;
  if (runtime == -2)
  {
    if (dbType === "sqlite")
    {
      d[0] = "failure";
    }
    else
    {
      d.time = "failure";
    }
  }
  else if (runtime == -1)
  {
    if (dbType === "sqlite")
    {
      d[0] = ">9000";
    }
    else
    {
      d.time = ">9000";
    }
  }

  return d; })

  var input_range = [];
  for (i = 0; i < dc.control_list_length; i++) { input_range.push(i); }

  var bar_width = width / dc.control_list_length;
  var max_runtime = d3.max(dc.results, function(d) { return mapRuntime(dbType === "sqlite" ? d[0] : d.time, 0); });
  if (max_runtime == 0) { max_runtime = 0.01; }

  var y_scale = d3.scale.linear()
      .domain([0, max_runtime])
      .range([height, 0]);

  // Set up axes.
  //  var xAxis = d3.svg.axis().scale(x_scale).orient("bottom");
  var yAxis = d3.svg.axis().scale(y_scale).orient("left").tickFormat(d3.format(".2s"));

  // Create svg object.
  var svg = d3.select(".svgholder").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Add y axis.
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Runtime (s)");

  // Create tooltips.
  var tip = d3.tip()
      .attr("class", "d3-tip")
      .offset([-10, 0])
      .html(function(d) {
        var runtime = dbType === "sqlite" ? d[0] : d.time;
        var parameterValue = (dbType === "sqlite" ? d[3] : d.parameter);
        parameterValue = parameterValue == "" ? "none" : parameterValue;
        if (runtime != ">9000" && runtime != "failure") { runtime = parseFloat(runtime).toFixed(3); }
        return "<b>" + (dbType === "sqlite" ? d[4] : d.lib) + "</b> implementation of<br><b>" + (dbType === "sqlite" ? d[2] : d.method) + "</b> with parameters<br><b>" + parameterValue + "</b>: " + runtime + "s";
      });

  // Add all of the data points.
  var bar = svg.selectAll("rect")
      .data(dc.results)
      .enter().append("g")
      .attr("transform", function(d, i) { return "translate(" + i * bar_width + ",0)"; });

  bar.append("rect")
      .attr("y", function(d) { if ((dbType === "sqlite" ? d[0] : d.time) == "failure") { return y_scale(max_runtime); } else { return y_scale(mapRuntime(dbType === "sqlite" ? d[0] : d.time, max_runtime)); } })
      .attr("height", function(d) { if (d[0] == "failure") { return height - y_scale(max_runtime); } else { return Math.max(height - y_scale(mapRuntime(dbType === "sqlite" ? d[0] : d.time, max_runtime)), 1); } })
      .attr("width", bar_width - 1)
      .attr("fill", function(d) { if ((dbType === "sqlite" ? d[0] : d.time) == "failure") { return "firebrick"; } else { return "steelblue"; } })
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);

  bar.append("text")
      .attr("x", bar_width / 2)
      .attr("y", function(d) { return height + 4; })
      .attr("dy", ".75em")
      .text(function(d, i) { return i; });

  svg.call(tip);
}
