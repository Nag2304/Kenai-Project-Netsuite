/**
 * *Ramp Tech Integrations 
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/redirect', 'N/runtime', 'N/task', 'N/url'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     */
    function (record, search, serverWidget, redirect, runtime, task, url) {
​
      /**
			 * Evaluate if the given string or object value is empty, null or
			 * undefined.
			 *
			 * @param {String}
			 *            stValue - string or object to evaluate
			 * @returns {Boolean} - true if empty/null/undefined, false if not
			 * @author mmeremilla
			 * @memberOf NSUtil
			 */
			var isEmpty = function(stValue) {
				return ((stValue === '' || stValue == null || stValue == undefined)
						|| (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function(
						v) {
					for ( var k in v)
						return false;
					return true;
				})(stValue)));
			};
​
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
​
            try {
​
                if (context.request.method === 'GET') {
​
                  var COL_PREFIX = "custpage_";
                  var LOG_DEBUG = "POST";
​
                  var objScript = runtime.getCurrentScript();
​
                    var customRecFieldOptionSearchId = objScript.getParameter({
                      name: 'custscript_saved_search_parameter'
                    });
​
                    var clientScriptFileId = objScript.getParameter({
                      name: 'custscript_client_script_id_2'
                    });
​
                    var searchPageLength = objScript.getParameter({
                      name: 'custscript_search_page_length'
                    });
​
                    var objForm = serverWidget.createForm({
                        title: 'Mark Sales order Ready to Fulfill',
                    });

					
					// ----- jjf 2021.08.16 START -----
					// Add customer and trandate filters
					
					// Add filter - customer
					var fldCustomer = objForm.addField({  
						id: 'custpage_filter_customer',
						type: serverWidget.FieldType.MULTISELECT,
						source: 'customer',
						label: 'Customer'
					});
					
					// Add filter - trandate from
					var fldDateFrom = objForm.addField({  
						id: 'custpage_filter_trandate_from',
						type: serverWidget.FieldType.DATE,
						label: 'Date From'
					});
					
					// Add filter - trandate to
					var fldDateTo = objForm.addField({  
						id: 'custpage_filter_trandate_to',
						type: serverWidget.FieldType.DATE,
						label: 'Date To'
					});
					
					// Set default values based from URL params
					if (context.request.parameters['customer']) fldCustomer.defaultValue = context.request.parameters['customer'];
					if (context.request.parameters['datefrom']) fldDateFrom.defaultValue = context.request.parameters['datefrom'];
					if (context.request.parameters['dateto']) fldDateTo.defaultValue = context.request.parameters['dateto'];
					
					// Add hidden field suitelet URL
					var fldSLUrl = objForm.addField({  
						id: 'custpage_suitelet_url',
						type: serverWidget.FieldType.TEXT,
						label: 'Suitelet URL'
					});
					
					fldSLUrl.defaultValue = (function(){
						var domain = url.resolveDomain({
							hostType: url.HostType.APPLICATION,
							accountId: runtime.accountId
						});
						var sl = url.resolveScript({
							scriptId: runtime.getCurrentScript().id,
							deploymentId: runtime.getCurrentScript().deploymentId
						});
						return 'https://'+domain+sl;
					})();
					
					fldSLUrl.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
					
					// Add `Search` button
					objForm.addButton({
						id: 'custpage_btn_search',
						label: 'Search',
						functionName: 'search'
					});
					
					// ----- jjf 2021.08.16 END -----
​

                    if (clientScriptFileId) {
                      objForm.clientScriptFileId = clientScriptFileId;
                      //objForm.clientScriptModulePath = "SuiteScripts/mo_cs_samplesuitelet_test.js";
                    }
​
                    log.debug('clientScriptFileId', clientScriptFileId);
​
                    objForm.addSubmitButton({label: 'Submit Lines'});
                    // objForm.addButton({id: 'custpage_cancel', label: 'Cancel', functionName: "window.history.back()"});
                    // objForm.addButton({id: 'custpage_select_all', label: 'Mark all', functionName: "selectAll()"});
                    // objForm.addButton({id: 'custpage_deselect_all', label: 'Unmark all', functionName: "deselectAll()"});
​
                    var objSelectedLinesField = objForm.addField({
                        id:"custpage_json_lines",
                        type:serverWidget.FieldType.LONGTEXT,
                        label:"Selected Lines JSON",
                      });
​
                        objSelectedLinesField.defaultValue = "[]";
​
                    var objSearchColumns = objForm.addField({
                        id:"custpage_search_columns",
                        type:serverWidget.FieldType.LONGTEXT,
                        label:"Search Columns Array",
                      });
​
                    var objSearchObjectField = objForm.addField({
                        id:"custpage_search_object",
                        type:serverWidget.FieldType.LONGTEXT,
                        label:"Search JSON",
                      });
​
                    var objLineListField = objForm.addField({
                        id:"custpage_search_line_list",
                        type:serverWidget.FieldType.SELECT,
                        label:"Search Page",
                      });
​
                    var objNumberOfResults = objForm.addField({
                        id:"custpage_result_number",
                        type:serverWidget.FieldType.INTEGER,
                        label:"Total Line Count",
                      });

					 
​
                    var objItemLineSublist = objForm.addSublist({
                        id: 'custpage_il_list',
                        type: serverWidget.SublistType.LIST,
                        label: 'Transaction Lines'
                    });
​
                    objItemLineSublist.addMarkAllButtons();
​
                    //Add custom columns
                    objItemLineSublist.addField({
                        id: 'custpage_select',
                        label: 'Ready to Fulfill',
                        type: serverWidget.FieldType.CHECKBOX
                    });

					 // Add Total Allocated Supply
					 var totalAllocatedSupply =	 objForm.addField({
                        id:"custpage_total_allocated_supply",
                        type:serverWidget.FieldType.INTEGER,
                        label:"Total Allocated Supply",
                      });



/* Commented By Lui Feb 25 2021   
			  var objAllocationField = objItemLineSublist.addField({
                        id: 'custpage_allocation_strategy',
                        label: 'Allocation Strategy',
                        type: serverWidget.FieldType.SELECT,
				
                        //source: "orderallocationstrategy"
                    });

                   // Internal IDS  for Order Allocation Strategy list 
						//<orderallocationstrategy>-2</orderallocationstrategy> “Predefined Available Allocation Strategy “
						//<orderallocationstrategy></orderallocationstrategy>  “-Do not Allocate-” it didn’t show up  on the  xml view of the order because it was Blank 
						//<orderallocationstrategy>-3</orderallocationstrategy>  “Predefined Complete Allocation Strategy”	

					objAllocationField.addSelectOption({value:0,text:"- Do not allocate -",isSelected:false});
                    objAllocationField.addSelectOption({value:-2,text:"Predefined Available Allocation Strategy ",isSelected:true});
                    objAllocationField.addSelectOption({value:-3,text:"Predefined Complete Allocation Strategy",isSelected:false});

//End Commented By Lui Feb 25 2021
​*/					
					var objTranSearch = search.load({
                        id: customRecFieldOptionSearchId
                    });
​					


					// ----- jjf 2021.08.16 START -----
					
					var urlparam = context.request.parameters;
					
					if (urlparam['customer']) 
					{
						var customers = urlparam['customer'] ? urlparam['customer'].split(',') : [];
						objTranSearch.filters.push(search.createFilter({
							name: 'entity',
							operator: search.Operator.ANYOF,
							values: customers
						}));
					}
					
					if (urlparam['datefrom'] && urlparam['dateto']) 
					{
						objTranSearch.filters.push(search.createFilter({
							name: 'trandate',
							operator: search.Operator.ONORAFTER,
							values: urlparam['datefrom']
						}));
						
						objTranSearch.filters.push(search.createFilter({
							name: 'trandate',
							operator: search.Operator.ONORBEFORE,
							values: urlparam['dateto']
						}));
					}
					
					// ----- jjf 2021.08.16 END -----
					
					
					
                    objSearchObjectField.defaultValue = customRecFieldOptionSearchId;
                    var intSearchResultCount = objTranSearch.runPaged().count;
                    objNumberOfResults.defaultValue = intSearchResultCount;
​
​
                    objNumberOfResults.updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
                    objSelectedLinesField.updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                    objSearchObjectField.updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                    objSearchColumns.updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                    objLineListField.updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});​

                    var j = 0;
​
                    var resultPaged = objTranSearch.runPaged();
                                      //  log.debug("resultPaged", resultPaged);
                    // Number of pages
                    var pageCount = resultPaged.pageRanges.length;
​
                    //Set Pages to selection
                    for (var x = 0; x < pageCount; x++) {
                      objLineListField.addSelectOption({value:x,text:"Page " + (x+1)});
                    }
​
                    //log.debug("Page Count", pageCount);
​
                    function retrievePage(resultPaged, pageIndex)
                    {
                      return resultPaged.fetch({
                        index: pageIndex
                      });
                    }
​
                    //var searchResult = retrievePage(resultPaged, 0);

					// jjf 2021.08.16 | Commented out
//                    var searchResult = objTranSearch.run().each(function(result){
//                       // .run().each has a limit of 4,000 results
//                       return true;
//                    });​

                    //log.debug("searchResult " +typeof(searchResult.data), searchResult.data);
​
                    var arrayOfColumns = [];
​
                    //Draw Columns
                    objTranSearch.columns.forEach(function(column){
    ​
                      column = JSON.parse(JSON.stringify(column));
    ​				
						if(column.type.toUpperCase() == serverWidget.FieldType.SELECT) {
	                        column.type = serverWidget.FieldType.TEXT;
	                      }
	    ​					
	                      var objColumn = objItemLineSublist.addField({
	                        id : COL_PREFIX+column.name,
	                        type : column.type,
	                        //type : serverWidget.FieldType.TEXT,
	                        label : column.label
	                      });
	
	                      objColumn.updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});​

                      arrayOfColumns.push(column.name);
​
                    });
​
                    objSearchColumns.defaultValue = JSON.stringify(arrayOfColumns);
                    //log.debug("objTranSearch", objTranSearch);
                    //var arrInvoices = searchInvoices(searchResult, objTranSearch);

					// jjf 2021.08.16 Do not perform search on initial suitelet load
					if (context.request.parameters['search']) 
					{
						var arrInvoices = searchInvoices(objTranSearch); // jjf Removed `searchResult` param, not used
	​
	                    //log.debug("ARRAY INVOICES", arrInvoices);
						var totalAllocatedSupplyValue = 0;
	​
	                    // for each search result - invoice, insert line into the sublist
	                    arrInvoices.forEach(function(result)
	                    {
							// --- jjf 2021.08.16 ---
							var soid = result['internalid'];
							var tranid = result['tranid'];
							var allocatedSupply = result['quantityallocated'];
							totalAllocatedSupplyValue  += parseInt(allocatedSupply);
							
							var docNoLink = (function(id, label){
								var linkUrl = url.resolveRecord({
									recordType: 'salesorder',
									recordId: id
								});
								return '<a href="'+linkUrl+'" target="_blank">'+ label +'</a>';
							})(soid, tranid);
							
							// --- jjf 2021.08.16 ---
							
	                        Object.keys(result).forEach(function(key){
		                        if(!isEmpty(result[key])) {
		                        	if (result[key] === false) {
		                          	//skip as the value is false
		                       		} else if (result[key] === true) {
		                          		objItemLineSublist.setSublistValue({
		                              		id : COL_PREFIX+key,
		                              		line : j,
		                              		value : "T"
		                            });
		                        }
		                        else {
									objItemLineSublist.setSublistValue({
		                              id : COL_PREFIX+key,
		                              line : j,
		                              value : (key=='tranid') ? docNoLink : result[key] // jjf
		                            });
		                        }
	                        	}   ​
	                   		});
	    ​
	                        j++;
	                    });

						log.audit('Search Parameter','Total Allocated Supply Value: '+totalAllocatedSupplyValue );
						totalAllocatedSupply.defaultValue = totalAllocatedSupplyValue;
						totalAllocatedSupply.updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});

					} // END OF IF CONTEXT.REQUEST.PARAMETERS['search']

                    context.response.writePage(objForm);
                } else { // POST - Process data

                  var arrayOfLines = [];

				  var totalAllocatedSupply = 0;

                  var intSublistLength = context.request.getLineCount({group:"custpage_il_list"});
                  log.debug("intSublistLength",intSublistLength);
                  for (var i = 0; i < intSublistLength; i++) {

                    var select = context.request.getSublistValue({group: 'custpage_il_list',name:'custpage_select',line:i});
                    //log.debug("select",select);
                    if (select == "T") {

                      var lineObject = {
                        transactionId: context.request.getSublistValue({group: 'custpage_il_list',name:'custpage_internalid',line:i}),
//Line commented to hide Allocation Strategy orderallocationstrategy: context.request.getSublistValue({group: 'custpage_il_list',name:'custpage_allocation_strategy',line:i}),
						orderallocationstrategy: "-2",
						line: context.request.getSublistValue({group: 'custpage_il_list',name:'custpage_line',line:i}),
                      };

                      arrayOfLines.push(lineObject);

                    }
					var allocatedSupply = context.request.getSublistValue({group: 'custpage_il_list',name:'custpage_quantityallocated',line:i});
totalAllocatedSupply += allocatedSupply;
                    //var strMemo = context.request.getSublistValue({group: 'custpage_il_list',name:'custpage_allocation_strategy',line:x});

                  }
	



                  //var arrayOfLines = context.request.parameters.custpage_json_lines;

                  log.debug("arrayOfLines",arrayOfLines);​
				 if (!isEmpty(arrayOfLines)){
                  if (context.request.parameters.custpage_json_lines) {
                    var objScript = runtime.getCurrentScript();
                    var intScriptId = objScript.getParameter({
                      name: 'custscript_mr_scriptid'
                    });
                    log.debug('M/R Script: ' + intScriptId);
​					
					// jjf 2021.08.16 Commented out
					/*
                    var objScheduledTask = task.create({
                      taskType: task.TaskType.MAP_REDUCE
                    });
                    objScheduledTask.scriptId = intScriptId;
                    objScheduledTask.params = {};
                    objScheduledTask.params.custscript_input = arrayOfLines;
                    objScheduledTask.params.custscript_user = runtime.getCurrentUser();
                    objScheduledTask.submit();
                    log.debug("objScheduledTask.params", objScheduledTask.params)
					*/
					
					// jjf 2021.08.16
					deployMapReduce({
						scriptId: intScriptId,
						params: {
							custscript_input: arrayOfLines,
							custscript_user: runtime.getCurrentUser()
						}
					});
                  }
​}
​
                  // redirect back to same suitelet
                  redirect.toSuitelet({
                    scriptId: context.request.parameters.script,
                    deploymentId: context.request.parameters.deploy
                  });
​
                }
​
            } catch (e) {
                throw e;
            }
​
        }
​		
		/**
		 * jjf 2021.08.16
		 */
		function deployMapReduce(option)
		{
			if (!option.scriptId) return;
			
			var deploy = function()
			{
				try
				{
					var objTask = task.create({ 
						taskType: task.TaskType.MAP_REDUCE,
						scriptId: option.scriptId,
						params: option.params
					});
					var taskId = objTask.submit();
				} 
				catch(e)
				{
					log.error('deployMapReduce', e.name+': '+e.message);
				}
				log.debug('deployMapReduce', 'deploy: taskId='+taskId);
				return taskId;
			};
			
			var copyDeployment = function()
			{
				var newDeployment = null;
				var objSearch = search.create({
					type: search.Type.SCRIPT_DEPLOYMENT,
					filters: [['script.scriptid','is',option.scriptId], 'AND',
								['status','is','NOTSCHEDULED'], 'AND',
								['isdeployed','is', 'T']],
					columns: ['scriptid']
				});
				
				objSearch.run().each(function(result){
					if (!result.id) return false;
					newDeployment = record.copy({
						type: record.Type.SCRIPT_DEPLOYMENT,
						id: result.id
					});
					var scriptName = result.getValue({ name:'scriptid' });
					scriptName = scriptName.toUpperCase().split('CUSTOMDEPLOY')[1];
					scriptName = scriptName.substring(0,20) + '_' + (Math.floor(Math.random()*90000)+10000);
					newDeployment.setValue({ fieldId: 'status', value: 'NOTSCHEDULED' });
					newDeployment.setValue({ fieldId: 'isdeployed', value: true });
					newDeployment.setValue({ fieldId: 'scriptid', value: scriptName.toLowerCase().trim() });
				});
				
				return newDeployment.save({
					enableSourcing: false,
					ignoreMandatoryFields: true
				});
			};
			
			var copyDeploymentAndDeploy = function() {
				copyDeployment();
				deploy();
			};
			
			return deploy() || copyDeploymentAndDeploy();
		}

        /**
         * Function searching for invoices based on provided parameter
         * @function searchInvoices
         *
         * @param {Object}
         *            objSearch - search object
         * @return {Array}
         *            arrResult - invoices array
         */
        //function searchInvoices(result,objSearch)
		function searchInvoices(objSearch) // jjf 
        {
          var stLogTitle = "searchInvoices"+'searchInvoices';
          log.debug(stLogTitle, '-- Entry --');
          var arrResult = [];
​		  
		  //  ---- jjf 2021.08.16 ---- 

		  var arrSearchResult = [];	
		  var rp = objSearch.runPaged();
		  
		  rp.pageRanges.forEach(function(pageRange){
		 	var mypage = rp.fetch({ index: pageRange.index });
			arrSearchResult = arrSearchResult.concat(mypage.data);
		  });

		  log.debug('searchInvoices', 'arrSearchResult.length='+arrSearchResult.length);
		  //  ---- jjf 2021.08.16 ---- 


          // Run search
          //objSearch.run().each(function(element){
          //result.data.forEach(function(element) {
​		  arrSearchResult.forEach(function(element){
            // log.debug(stLogTitle, 'element: ' + JSON.stringify(element));
            var objResultItem = {};
            objResultItem.id = element.id;
​
            //log.debug("objSearch.columns", objSearch.columns);
​
            objSearch.columns.forEach(function(column){
​
              column = JSON.parse(JSON.stringify(column));
​
              // log.debug(stLogTitle, 'column.type: ' + column.type+' | ui.FieldType.SELECT: '+ui.FieldType.SELECT);
​
              if(column.type.toUpperCase() == serverWidget.FieldType.SELECT)
              {
                objResultItem[column.name] = element.getText(column);
              }
              else
              {
                objResultItem[column.name] = element.getValue(column);
              }
​
            });
​
            arrResult.push(objResultItem);
            return true;
          });
​
          log.debug(stLogTitle, '-- Exit --');
​
          return arrResult;
        }
​
        return {
            onRequest: onRequest
        };
​
    });
	 function isEmpty(value) {
      if (value === null) {
         return true;
      } else if (value === undefined) {
         return true;
      } else if (value === '') {
         return true;
      } else if (value === ' ') {
         return true;
      } else if (value === 'null') {
         return true;
      } else {
         return false;
      }
   }

