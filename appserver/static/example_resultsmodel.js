require([
    "splunkjs/mvc",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/tableview",
    "splunkjs/mvc/dropdownview",
    "splunkjs/mvc/simplexml/ready!"
], function(
    mvc,
    SearchManager,
    TableView,
    DropdownView
) {

    // Create the search manager and views
    var mainSearch = new SearchManager({
        id: "mysearch",
        search: "index=_internal | head 5",
        data: mvc.tokenSafe("$datamod$"),
        status_buckets: 300,
        preview: true,
        cache: false
    });

    var table1 = new TableView({
        id:"table",
        managerid: "mysearch",
        el: $("#mytable")
    }).render();

    var mydropdown = new DropdownView({
        id: "selData",
        showClearButton: false,
        value: mvc.tokenSafe("$datamod$"),
        el: $("#mydropdown")
    }).render();

    // Set the dropdown list choices
    var choices = [
        {label: "events",  value: "events" },
        {label: "preview", value: "preview"},
        {label: "results", value: "results"},
        {label: "summary", value: "summary"}
    ];
    mydropdown.settings.set("choices", choices);

    // Display the type of selected results model in the console
    var myChoice = "results";
    mydropdown.on("change", function(){
        myChoice = mydropdown.settings.get("value");
        var myResults = mainSearch.data(myChoice);
        myResults.on("data", function() {
            console.log("Type: ", myChoice);
            console.log("Has data? ", myResults.hasData());
            console.log("Data (rows): ", myResults.data().rows);
            console.log("Backbone collection: (rows) ", myResults.collection().raw.rows);
        });
    });

});
