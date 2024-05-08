/**
 * 
 * This software is the confidential and proprietary information of NetSuite,
 * Inc. ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the license
 * agreement you entered into with NetSuite. Module Description
 *
 * Version    Date            Author           Remarks
 * 
 * 1.00       2019 May 22     MGutierrez       Added file description at top
 * 2.00       2019 May 22     MGutierrez       Case 03083570 : changed comment to primary DC
 *
 * DWR - Store Transfer Assistant
 */


function storeTransferSuitelet(request, response) {
    var stLoggerTitle = 'storeTransferSuitelet';
    nlapiLogExecution('DEBUG', stLoggerTitle, '>> Entry <<');
	var context = nlapiGetContext();
	var user = context.getUser();
	var getForm = nlapiCreateForm('Store Transfer Assistant', false);
	var date = new Date();
	var newBatchURL = context.getSetting('SCRIPT', 'custscript_dwr_new_batch_url');
	date = nlapiDateToString(date);
	getForm.addTab('custpage_dwr_subtab_tran_orders', 'Transfer Order');
	getForm.addSubmitButton('Submit');
    // CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
    // client side script that will re-load suitelet when location is changed
	getForm.setScript('customscript_dwr_to_assistant_client');
	// NOTE:  Backslashes at end of each line are used to make a multiline string, which makes the code for the function easier to read/manage.
	var invScript = "var popup = window.open('', '_blank', 'height=600,width=1000,resizable=1'); \
		var curBatchId = nlapiGetFieldValue('custpage_batchid'); \
		console.log(curBatchId + ',' + typeof curBatchId + ', ' + curBatchId.length); \
		if (curBatchId.length == 0)\
		{\
			var html = '<style>* {font-family: Helvetica, Arial; color: grey;}</style><h3>No batch ID selected</h3>'; \
		}\
		else \
		{\
			var filters = new Array(); \
			filters[0] = new nlobjSearchFilter('custrecord_dwr_batch_id_2', null, 'is', curBatchId.toString());  \
			var columns = new Array(); \
			columns[0] = new nlobjSearchColumn('custrecord_dwr_st_item', null, 'group'); \
			columns[1] = new nlobjSearchColumn('displayname', 'CUSTRECORD_DWR_ST_ITEM', 'group'); \
			columns[2] = new nlobjSearchColumn('custrecord_dwr_st_item_qty', null, 'sum'); \
			columns[3] = new nlobjSearchColumn('custrecord_dwr_ship_group', null, 'group'); \
			var search = nlapiSearchRecord('customrecord_dwr_storetransfer_imports', null, filters, columns); \
			if (search == null)\
			{\
				var html = '<style>* {font-family: Helvetica, Arial; color: grey;}</style><h3>No items in batch</h3>'; \
			} \
			else \
			{\
				var html = '<style>* {font-family: Helvetica, Arial; color: grey;} table, table tr td, table tr th { border: 1px solid grey;}</style><table><tr><th>SKU</th><th>Item</th><th>Quantity</th><th>Ship Group</th></tr>';\
				for (var i = 0; i < search.length; i++) \
				{ \
					var sku = search[i].rawValues[0].text; \
					var description = search[i].rawValues[1].value; \
					var quantity = search[i].rawValues[2].value; \
					var shipGroup = search[i].rawValues[3].value;\
					html += '<tr><td>' + sku + '</td><td>' + description + '</td><td>' + quantity + '</td><td>' + shipGroup + '</td></tr>'; \
				}\
				html += '</table>';\
			}\
		}\
		popup.document.write(html);\
		";
	getForm.addButton('custbutton_view_cur_batch', 'Get Batch Quantities ', invScript);
	var newBatchScript = "window.open('" + newBatchURL + "', '_blank', 'height=600,width=1000,resizable=1');";
	getForm.addButton('custbutton_new_batch', 'Create New Batch', newBatchScript);
	var closeBatchScript = "window.open(nlapiResolveURL('SUITELET', 'customscript_dwr_transfer_batch_suitelet', 'customdeploy_dwr_transfer_batch_suitelet'), '_blank', 'height=600,width=1000,resizable=1');"
	getForm.addButton('custbutton_close_batches', 'Close Batches ', closeBatchScript);

    // CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
    // Set button to use new Client Side function that will re-load page with no pre-filled values
	getForm.addButton('custbutton_clear_fields', 'Clear Fields', 'clearFields();');

	getForm.addTab('custpage_items', 'Items');
	getForm.addField('custpage_date', 'date', 'Date').setMandatory(true);
	getForm.addField('custpage_item', 'select', 'Item', 'item').setMandatory(true);

    // CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
    // get value indicating that field values should be preserved from previous submission 
	var stPreserveFieldValues = request.getParameter('custpage_preserve_values');
	var preserveFieldValues = stringToBool(stPreserveFieldValues);

	//Workaround to get Shipping Items to populate in List.  Thanks, Netsuite (sarcasm).
	var tiSearch = nlapiLoadSearch(null, 'customsearch_dwr_transfer_imports');
	var tiSearchResult = tiSearch.runSearch();
	var tiResultset = tiSearchResult.getResults(0, 1);
	var custRecord = nlapiLoadRecord('customrecord_dwr_storetransfer_imports', tiResultset[0].getId()); //This is not any particular record we're loading to do this.
	//var shipFld = custRecord.getField('custrecord_dwr_ship_method');
	var batchList = custRecord.getField('custrecord_dwr_batch_id_list')
	//var options = shipFld.getSelectOptions();
	var batchOptions = batchList.getSelectOptions();

	//var select = getForm.addField('custpage_shipping', 'select', 'Ship Method').setMandatory(true);
	//for (var i = 0; i < options.length; i++) {
	//	select.addSelectOption(options[i].id,options[i].text);
	//}


	getForm.addField('custpage_employee', 'select', 'Employee', 'employee').setMandatory(true);
	var batchList = getForm.addField('custpage_batchid', 'select', 'Batch ID').setMandatory(true);
	batchList.addSelectOption(null, '', true);
	for (var i = 0; i < batchOptions.length; i++) {
		batchList.addSelectOption(batchOptions[i].id,batchOptions[i].text);
	}

    batchList.setDefaultValue(request.getParameter('custpage_batchid'));

	var fld = getForm.addField('custpage_total', 'integer', 'Total').setMandatory(true);
	if (preserveFieldValues) {
	    fld.setDefaultValue(request.getParameter('custpage_total'));
	}

    // CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
    // add field that indicates how may remain from total 
	var fld = getForm.addField('custpage_remaining', 'integer', 'Remaining').setDisplayType('disabled');
	if (preserveFieldValues) {
	    fld.setDefaultValue(request.getParameter('custpage_remaining'));
	}

	var fld = getForm.addField('custpage_ship_group', 'integer', 'Ship Group');
	if (preserveFieldValues) {
	    fld.setDefaultValue(request.getParameter('custpage_ship_group'));
	}
	getForm.addField('custpage_notice', 'inlinehtml', 'Last Status');
	getForm.setFieldValues({ custpage_date: date, custpage_employee: user, custpage_shipping: '66' });

    // CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
    // Adding field so user can view only a sub-set of locations based on value selected
	var stSelectedLocationId = request.getParameter('custpage_location');
	var stSelectedLocationName = '';
	var fldLocation = getForm.addField('custpage_location', 'select', 'Location');
	fldLocation.addSelectOption(null, '-All-', true);
	var arrLocResults = nlapiSearchRecord('location', 'customsearch_dwr_parent_locations', null, null);
	if (arrLocResults != null)
	{
	    var arrColumns = arrLocResults[0].getAllColumns();
	    for (var i = 0; i < arrLocResults.length; i++)
	    {
	        var locResult = arrLocResults[i];
	        var locId = locResult.getId();
	        var locName = locResult.getValue(arrColumns[0]);
	        var selected = false;
	        if (locId == stSelectedLocationId)
	        {
	            stSelectedLocationName = locName;
	            selected = true;
	        }

	        fldLocation.addSelectOption(locId, locName, selected);
	    }
	}

    // CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
    // add field to indicate that user would like all fields entered to be preserved when form is loaded again
	var fldPreserveFieldValues = getForm.addField('custpage_preserve_values', 'checkbox', 'Preserve Values');
	if (preserveFieldValues)
	{
	    fldPreserveFieldValues.setDefaultValue(stPreserveFieldValues);
	}

    // CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
    // add field to allow a user to populate all line items in the sublist with a pre-determined value
	var fldSelectAll = getForm.addField('custpage_select_all', 'checkbox', 'Select All');
	if (preserveFieldValues) {
	    fldSelectAll.setDefaultValue(request.getParameter('custpage_select_all'));
	}

	var sublistItem = getForm.addSubList('custpage_dwr_sublist_item', 'list', 'Locations', 'custpage_locations');

	sublistItem.addField('custpage_dwr_loc_name', 'text', 'Location');
	var locQty = sublistItem.addField('custpage_dwr_loc_qty', 'integer', 'Quantity');
	locQty.setDisplayType('entry');
	var locationID = sublistItem.addField('custpage_dwr_loc_id', 'text', 'Internal ID');
	locationID.setDisplayType('hidden');
	var ccID = sublistItem.addField('custpage_dwr_cc_id', 'text', 'Cost Center');
	ccID.setDisplayType('disabled');
	sublistItem.addField('custpage_dwr_address1', 'text', 'Address').setDisplayType('disabled');
	sublistItem.addField('custpage_dwr_city', 'text', 'City').setDisplayType('disabled');
	sublistItem.addField('custpage_dwr_state', 'text', 'State/Province').setDisplayType('disabled');
	sublistItem.addField('custpage_dwr_zip', 'text', 'Zip').setDisplayType('disabled');
	sublistItem.addField('custpage_dwr_time_zone', 'text', 'Time Zone').setDisplayType('disabled');
	sublistItem.addField('custpage_dwr_country', 'text', 'Country').setDisplayType('disabled');

		//Get Locations from Saved Search
	var search = nlapiLoadSearch(null, 'customsearch_dwr_all_locations');
    // CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
    // filter locations by selection made in drop down
	if (!isEmpty(stSelectedLocationName))
	{
	    var filter = new nlobjSearchFilter('name', null, 'startswith', stSelectedLocationName);
	    search.addFilter(filter);
	}

	var searchResult = search.runSearch();
	var columns = searchResult.getColumns();
	var resultset = searchResult.getResults(0, 100);

	nlapiLogExecution('DEBUG', stLoggerTitle + ' resultset.length', resultset);

	for (var i = 1; i <= resultset.length; i++) 
	{

		sublistItem.setLineItemValue('custpage_dwr_loc_name', i, resultset[i - 1].getValue('name'));
		sublistItem.setLineItemValue('custpage_dwr_loc_id', i, resultset[i - 1].getId());
		sublistItem.setLineItemValue('custpage_dwr_cc_id', i, resultset[i - 1].getValue('custrecord_dwr_cost_center'));
		sublistItem.setLineItemValue('custpage_dwr_address1', i, resultset[i - 1].getValue(columns[7]));
		sublistItem.setLineItemValue('custpage_dwr_city', i, resultset[i - 1].getValue(columns[2]));
		sublistItem.setLineItemValue('custpage_dwr_state', i, resultset[i - 1].getValue(columns[3]));
		sublistItem.setLineItemValue('custpage_dwr_zip', i, resultset[i - 1].getValue(columns[8]));
		sublistItem.setLineItemValue('custpage_dwr_time_zone', i, resultset[i - 1].getValue(columns[9]));
		sublistItem.setLineItemValue('custpage_dwr_country', i, resultset[i - 1].getValue(columns[10]));
		
	    // CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
        // If user would like to preserve values from previous submission, populate line items with values from previous submission 
		if (preserveFieldValues)
		{
		    var itemQty = request.getLineItemValue('custpage_dwr_sublist_item', 'custpage_dwr_loc_qty', i);
		    if (!isEmpty(itemQty))
		    {
		        sublistItem.setLineItemValue('custpage_dwr_loc_qty', i, itemQty);
		    }
		}
	}

	if (request.getMethod()	== 'GET')
	{
	    nlapiLogExecution('DEBUG', stLoggerTitle, '>> Get <<');
		response.writePage(getForm);
	}
	if (request.getMethod() == 'POST') 
	{
	    nlapiLogExecution('DEBUG', stLoggerTitle, '>> Post <<');
		var total = 0;
		var paramTotal = Number(request.getParameter('custpage_total'));
		var batchID = request.getParameter('custpage_batchid');
		var employee = request.getParameter('custpage_employee');
		var itemDisplay = request.getParameter('custpage_item_display');
		var itemId = request.getParameter('custpage_item');
		//var shipMethod = request.getParameter('custpage_shipping');
		var shipMethod = nlapiLookupField('customrecord_dwr_transfer_batch', batchID, 'custrecord_dwr_tnsfr_batch_ship_method');
		var employee = request.getParameter('custpage_employee');
		var shipGroup = request.getParameter('custpage_ship_group');
		var memo = nlapiLookupField('customrecord_dwr_transfer_batch', batchID, 'altname'); // This is the description that would appear with the batch ID on the UI.
		var objArray = new Array();
		for (var i = 1; i <=resultset.length; i++) 
		{
			var itemQty = request.getLineItemValue('custpage_dwr_sublist_item', 'custpage_dwr_loc_qty', i);
			if (itemQty != null)
			{
				objArray.push({
					location: request.getLineItemValue('custpage_dwr_sublist_item', 'custpage_dwr_loc_id', i),
					quantity: itemQty,
					costCenter: request.getLineItemValue('custpage_dwr_sublist_item', 'custpage_dwr_cc_id', i)
				});
				total += Number(itemQty);
			}
		}
		getForm.setFieldValues({custpage_batchid: batchID});
		var batchClosed = nlapiLookupField('customrecord_dwr_transfer_batch', batchID, 'custrecord_dwr_transfer_batch_complete');
		if (paramTotal == total && batchClosed == 'F')
		{
			//getForm.addField('custpage_notice', 'help', "Submitted " +  total + " of item: " + itemDisplay);
			for (var j = 0; j < objArray.length; j++)
			{	
				try
				{
				    var record = nlapiCreateRecord('customrecord_dwr_storetransfer_imports');
				    //CMP 03083516 -Removed Kit Logic as no Kit will ever be passed into this part, only the component
				    var sourceloc = nlapiLookupField('item', itemId, 'preferredlocation');
				    nlapiLogExecution('DEBUG', 'Variable Check', 'sourceloc: ' + sourceloc);
				    record.setFieldValue('custrecord_dwr_st_source_location', sourceloc); //sets source to primary DC 
					record.setFieldValue('custrecord_dwr_st_transferto_location', Number(objArray[j].location)); 
					record.setFieldValue('custrecord_dwr_st_cost_center', Number(objArray[j].costCenter));
					record.setFieldValue('custrecord_dwr_st_item', itemId);
					record.setFieldValue('custrecord_dwr_st_item_qty', objArray[j].quantity);
					record.setFieldValue('custrecord_dwr_batch_id_2', batchID);
					record.setFieldValue('custrecord_dwr_ship_method', shipMethod);
					record.setFieldValue('custrecord_dwr_ship_group', shipGroup);
					record.setFieldValue('custrecord_dwr_employee_on_transfer', employee);
					record.setFieldValue('custrecord_dwr_memo', memo);
					nlapiSubmitRecord(record);
				}
				catch(err)
				{
					if (err.getDetails != undefined) 
			    	{
			            nlapiLogExecution('ERROR', 'Process Error', err.getCode() + ': ' + err.getDetails() + ' : ' + err.message);			          
			        }
					else 
					{
						nlapiLogExecution('ERROR', 'Unexpected Error', err.toString());
					}
				}
				getForm.setFieldValues({custpage_notice: "There was an error in processing this item.  Contact Helpdesk for more information/assistance."});								
			}
			getForm.setFieldValues({custpage_notice: "Submitted " +  total + " of item: " + itemDisplay});
		}
		else if (batchClosed == 'T' && paramTotal != total)
		{
			getForm.setFieldValues({custpage_notice: "<h3 style='color: red; font-size:1.5em;'>ERRORS: Header total: " + paramTotal + ".  Actual total: " + total + ", Batch " + batchID + " already closed.", custpage_item: itemId, custpage_employee: employee, custpage_shipping: shipMethod, custpage_memo: memo + '</h3>'});
			sublistItem = recalculateQtys(objArray, resultset, sublistItem, request);
		}
		else if (paramTotal != total)
		{
			getForm.setFieldValues({custpage_notice: "<h3 style='color: red; font-size:1.5em;'>ERROR: Header total: " + paramTotal + ".  Actual total: " + total, custpage_item: itemId, custpage_employee: employee, custpage_shipping: shipMethod, custpage_memo: memo + '</h3>'});
			sublistItem = recalculateQtys(objArray, resultset, sublistItem, request);
		}
		else if (batchClosed == 'T')
		{
			getForm.setFieldValues({custpage_notice: "<h3 style='color: red; font-size:1.5em;'>ERROR: Batch " + batchID + " already closed.", custpage_item: itemId, custpage_employee: employee, custpage_shipping: shipMethod, custpage_memo: memo + '</h3>'});
			sublistItem = recalculateQtys(objArray, resultset, sublistItem, request);
		}
		response.writePage(getForm);
	}
	nlapiLogExecution('DEBUG', stLoggerTitle, '>> Exit <<');
}

function recalculateQtys(arr, locs, sublist, req) {
	for (var a = 0; a < arr.length; a++) 
	{
		var errLocationId = arr[a].location;
		for (var b = 1; b <= locs.length; b++) 
		{

			var errQtyLocation = req.getLineItemValue('custpage_dwr_sublist_item', 'custpage_dwr_loc_id', b);
			if (errQtyLocation == errLocationId)
			{
				sublist.setLineItemValue('custpage_dwr_loc_qty', b, arr[a].quantity);
				break;
			}
		}
	}
	return sublist;
}

// CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
// reload page when location is changed
// recaluclate "remaining" when qty or total is changed
// add qty 1 to all line items when "Select All" is checked
function fieldChanged(type, name, linenum)
{
    if (name == 'custpage_location')
    {
        var fieldIds = new Array();
        var stParams = '';
        fieldIds.push('custpage_date');
        fieldIds.push('custpage_item');
        fieldIds.push('custpage_employee');
        fieldIds.push('custpage_batchid');
        fieldIds.push('custpage_total');
        fieldIds.push('custpage_remaining');
        fieldIds.push('custpage_ship_group');
        fieldIds.push('custpage_location');
        fieldIds.push('custpage_select_all');
        
        for (var i = 0; i < fieldIds.length; i++) {
            var stFieldId = fieldIds[i];
            stParams += '&' + stFieldId + '=' + nlapiGetFieldValue(stFieldId);
        }
        stParams += '&' + 'custpage_preserve_values' + '=' + 'T';

        setWindowChanged(window, false);
        var stSuiteletUrl = nlapiResolveURL('SUITELET', 'customscript_dwr_transfer_order_assist', 'customdeploy_dwr_transfer_order_assist');
        window.location.href = stSuiteletUrl + stParams;
    } else if (type == 'custpage_dwr_sublist_item' && name == 'custpage_dwr_loc_qty')
    {
        var intTotal = Number(nlapiGetFieldValue('custpage_total'));
        var intRemaining = Number(nlapiGetFieldValue('custpage_total'));
        var count = nlapiGetLineItemCount('custpage_dwr_sublist_item');
        if (!isEmpty(intTotal)) {
            for (var i = 1; i <= count; i++) {
                var qty = Number(nlapiGetLineItemValue('custpage_dwr_sublist_item', 'custpage_dwr_loc_qty', i, 1));
                intRemaining -= qty;
            }
            nlapiSetFieldValue('custpage_remaining', intRemaining);
        }

    } else if (name == 'custpage_total')
    {
        var intTotal = Number(nlapiGetFieldValue('custpage_total'));
        var intRemaining = Number(nlapiGetFieldValue('custpage_total'));
        var count = nlapiGetLineItemCount('custpage_dwr_sublist_item');
        if (!isEmpty(intTotal)) {
            for (var i = 1; i <= count; i++) {
                var qty = Number(nlapiGetLineItemValue('custpage_dwr_sublist_item', 'custpage_dwr_loc_qty', i, 1));
                intRemaining -= qty;
            }
            nlapiSetFieldValue('custpage_remaining', intRemaining, false);
        }
    } else if (name == 'custpage_select_all')
    {
        var stSelectAll = nlapiGetFieldValue('custpage_select_all');
        if (stSelectAll == 'T') {
            var count = nlapiGetLineItemCount('custpage_dwr_sublist_item');
            for(var i = 1; i <= count; i++)
            {
                nlapiSetLineItemValue('custpage_dwr_sublist_item', 'custpage_dwr_loc_qty', i, 1);
            }

            fieldChanged(null, 'custpage_total', null);
        }
    }
} // END FUNC fieldChanged

// CMP 02398149: Transfer Order Assistant Enhancements for Order Entry
// Client side function that will re-load the suitelet with no pre-filled values
function clearFields() {
    var stParams = '';
    var fieldIds = new Array();
    fieldIds.push('custpage_batchid');

    for (var i = 0; i < fieldIds.length; i++) {
        var stFieldId = fieldIds[i];
        stParams += '&' + stFieldId + '=' + nlapiGetFieldValue(stFieldId);
    }
    setWindowChanged(window, false);
    var stSuiteletUrl = nlapiResolveURL('SUITELET', 'customscript_dwr_transfer_order_assist', 'customdeploy_dwr_transfer_order_assist');
    window.location.href = stSuiteletUrl + stParams;
}
