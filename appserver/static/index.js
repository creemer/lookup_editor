require([
    'jquery', 
    'underscore', 
    'prettify',
    "backbone",
    'splunkjs/ready!',
    'splunkjs/mvc', 
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/datatemplateview'
], function($, _, prettyPrint, mvc, SearchManager, DataTemplateView) {
    console.log('Start of Change.js v 1.0');
    
    var defaultTokenModel = splunkjs.mvc.Components.getInstance('default', {create: true});
    var submittedTokenModel = splunkjs.mvc.Components.getInstance('submitted', {create: true});

    var SearchBarView = require("splunkjs/mvc/searchbarview");
    new SearchBarView({
        id: "example-search-bar",
        managerid: "main-search",
        el: $("#searchBarDiv")
    }).render();
    
    var TableView = require("splunkjs/mvc/tableview");
    new TableView({
        id: "example-table",
        managerid: "postproc1",
        pageSize: "100000",
        el: $("#tableDiv") // seperate div
    }).render();
    
    var SearchManager = require("splunkjs/mvc/searchmanager");
    new SearchManager({
        id: "main-search",
        earliest_time: "-1h@h",
        search: "index=_internal | timechart sum(ev) as summ span=10s",
    });

    var PostProcessManager = require("splunkjs/mvc/postprocessmanager");
    new PostProcessManager({
        id: "postproc1",
        managerid: "main-search",
        search: "| where isnotnull(summ)" 
    });
    
    // Hooking up events 
    /////////////////////////////////////////////
    var manager = splunkjs.mvc.Components.getInstance("main-search");
    var searchbar = splunkjs.mvc.Components.getInstance("example-search-bar");
    var table = splunkjs.mvc.Components.getInstance("example-table");
    var postprocess = splunkjs.mvc.Components.getInstance("postproc1");
    var timerange = searchbar.timerange;
    var notNull = document.getElementById('notNull');
    var withNull = document.getElementById('withNull');
    var grabData = document.getElementById('grabData');
    var concatData = document.getElementById('concatData');
    var buttons = [
        document.getElementById('ten'),
        document.getElementById('fifty'),
        document.getElementById('hundred')
    ];
    
    concatData.addEventListener('click', function() {
        let changed = JSON.parse(defaultTokenModel.get('new_token'));
        let tableValues = JSON.parse(defaultTokenModel.get('table-values'));

        /**
         * compare two arrays: with all search values
         */
        for(let i = 0, len = tableValues.length; i < len; i++) {
            for (let j = 0; j < changed.length; j++) {
                if(tableValues[i][0] !== changed[j][0]) {
                    continue;
                } else {
                    console.log("SAME DATE!");
                    tableValues[i][1] = changed[j][1];
                }
            }
        }

        defaultTokenModel.set('table-values-final', JSON.stringify(tableValues));
        submittedTokenModel.set('table-values-final', JSON.stringify(tableValues));
        console.log('tableValues', JSON.stringify(tableValues));
    });

    grabData.addEventListener('click', function() {
        console.log('table-values', defaultTokenModel.get('table-values'));
    });

    // Handle click on table cell.
    table.on("click:cell", function(ev) {
        ev.preventDefault();
        console.log('event', ev);

        if(ev.field === '_time') return;
        if(!window.confirm('You want to change value?')) return;
        
        let tokenInner = JSON.parse(defaultTokenModel.get('new_token'));

        if(!tokenInner.length || tokenInner.length < 1) tokenInner = [];
        
        ev.value = prompt('Please enter the value', ev.value) || ev.value;

        //make the array of values
        let obj = [];
        obj[0] = ev.data["row._time"];
        obj[1] = ev.value;
        tokenInner.push(obj);

        //push this data to token in json format
        defaultTokenModel.set('new_token', JSON.stringify(tokenInner));

        /**
         * get cell adress in table, by ev.index value and ev.column value. 
         * it is like a matrix.
         * and change the value, to user value.
         */
        let tbody = table.el.querySelector('tbody');
        let cell = '[data-row-index="'+ ev.index +'"] ' + '[data-cell-index="'+ ev.column +'"]';
        tbody.querySelector(cell).innerText = ev.value;

        console.log('new_token', defaultTokenModel.get('new_token'));
    });

    // push value from search bar to search manager.
    searchbar.on("change", function() {
        manager.set("search", searchbar.val()); 
    });
    
    // push value from timerange component to search manager.
    timerange.on("change", function() {
        manager.search.set(timerange.val()); 
    });

    // make search WITH postprocess search.
    notNull.addEventListener('click', function() {
        table.settings.set('managerid', 'postproc1');
        manager.startSearch();
    });
    
    // make search WITHOUT postprocess search.
    withNull.addEventListener('click', function() {
        table.settings.set('managerid', 'main-search');
        manager.startSearch();
    });

    // add eventlisteners to  buttons, on array "buttons"
    buttons.forEach(function(button) {

        button.addEventListener('click', function() {
            switch (button.id) {
                case 'ten':
                    manager.settings.set('search', "index=_internal | timechart sum(ev) as summ span=10s");
                    break;
                case 'fifty':
                    manager.settings.set('search', "index=_internal | timechart sum(ev) as summ span=50s");
                    break;
                case 'hundred':
                    manager.settings.set('search', "index=_internal | timechart sum(ev) as summ span=100s");
                    break;
                
                default:
                    break;
            }
            searchbar.settings.set('value', manager.settings.get('search'));
            manager.startSearch();
        })
    });
    
    // get main search instance based on tablemanager value.
    // then get data instance from search
    var mySearch = splunkjs.mvc.Components.getInstance(table.settings.get('managerid'));
    var myResult = mySearch.data('results', {count: 0});
    
    /**
     * get data from search!
     * mySearch must look to needed search id.
     */
    myResult.on('data', function(results) {
        console.log('has data?', myResult.hasData());

        for(let i = 0, len = results._data['rows'].length; i < len; i++){
            results._data['rows'][i].pop();
        }
        
        // push data to token
        defaultTokenModel.set('table-values', JSON.stringify(results._data['rows']));
        defaultTokenModel.set('new_token', '[]');
        
        var maxCount = parseInt(defaultTokenModel.get('maxCount'), 10);
        console.log('maxCount', maxCount, typeof(maxCount));

        // can doing something with data
        if(results._data['rows'].length > maxCount) {
            // some code
            if(confirm('Зеначений в таблице больше чем ' + maxCount +'!! Вы точно хотите их отобразить?')) {
                return;
            } else {
                table.el.style.display = 'none';
                alert('Слишком много значений.')
            }
        } else {
            // some code
            console.log('results._data["rows"].length', results._data['rows'].length);
            table.el.style.display = '';
        }
    })

    /////////////////////////////////////


    
    ////////////////////////////////////
    
    /**
     * This part of code to get data from searchManager
     * 
     
    var mainSearch = mvc.Components.get("example-timeline-search");
    console.log('mainSerch', mainSearch);
    var myResults = mainSearch.data("preview", { count: 25, offset: 10 });
    console.log('myResults', myResults);

    myResults.on("data", function() {
        // The full data object
        console.log(myResults.data());
    
        // Indicates whether the results model has data
        console.log("Has data? ", myResults.hasData());
    
        // The results rows
        console.log("Data (rows): ", myResults.data().rows);
    
        // The Backbone collection
        console.log("Backbone collection: ", myResults.collection());
    });
    */
});
