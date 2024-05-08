/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

var PAGE_SIZE = 50;
var SEARCH_ID = 'customsearch1344';
var CLIENT_SCRIPT_FILE_ID = 11520;

define(['N/ui/serverWidget', 'N/search', 'N/redirect'], function (
  serverWidget,
  search,
  redirect
) {
  function onRequest(context) {
    if (context.request.method == 'GET') {
      var form = serverWidget.createForm({
        title: 'Transaction Amounts',
        hideNavBar: false,
      });

      form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;

      // Get parameters
      var pageId = parseInt(context.request.parameters.page);
      var scriptId = context.request.parameters.script;
      var deploymentId = context.request.parameters.deploy;

      // Add sublist that will show results
      var sublist = form.addSublist({
        id: 'custpage_table',
        type: serverWidget.SublistType.LIST,
        label: 'Transactions',
      });

      // Add columns to be shown on Page
      sublist.addField({
        id: 'id',
        label: 'Internal ID',
        type: serverWidget.FieldType.TEXT,
      });

      sublist.addField({
        id: 'amount',
        label: 'Amount',
        type: serverWidget.FieldType.CURRENCY,
      });

      // Run search and determine page count
      var retrieveSearch = runSearch(SEARCH_ID, PAGE_SIZE);
      var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);

      // Set pageId to correct value if out of index
      if (!pageId || pageId == '' || pageId < 0) pageId = 0;
      else if (pageId >= pageCount) pageId = pageCount - 1;

      // Add buttons to simulate Next & Previous
      if (pageId != 0) {
        form.addButton({
          id: 'custpage_previous',
          label: 'Previous',
          functionName:
            'getSuiteletPage(' +
            scriptId +
            ', ' +
            deploymentId +
            ', ' +
            (pageId - 1) +
            ')',
        });
      }

      if (pageId != pageCount - 1) {
        form.addButton({
          id: 'custpage_next',
          label: 'Next',
          functionName:
            'getSuiteletPage(' +
            scriptId +
            ', ' +
            deploymentId +
            ', ' +
            (pageId + 1) +
            ')',
        });
      }

      // Add drop-down and options to navigate to specific page
      var selectOptions = form.addField({
        id: 'custpage_pageid',
        label: 'Page Index',
        type: serverWidget.FieldType.SELECT,
      });

      for (i = 0; i < pageCount; i++) {
        if (i == pageId) {
          selectOptions.addSelectOption({
            value: 'pageid_' + i,
            text: i * PAGE_SIZE + 1 + ' - ' + (i + 1) * PAGE_SIZE,
            isSelected: true,
          });
        } else {
          selectOptions.addSelectOption({
            value: 'pageid_' + i,
            text: i * PAGE_SIZE + 1 + ' - ' + (i + 1) * PAGE_SIZE,
          });
        }
      }

      // Get subset of data to be shown on page
      var addResults = fetchSearchResult(retrieveSearch, pageId);

      // Set data returned to columns
      var j = 0;
      addResults.forEach(function (result) {
        sublist.setSublistValue({
          id: 'id',
          line: j,
          value: result.id,
        });

        sublist.setSublistValue({
          id: 'amount',
          line: j,
          value: result.amount,
        });

        j++;
      });

      context.response.writePage(form);
    }
  }

  return {
    onRequest: onRequest,
  };

  function runSearch(searchId, searchPageSize) {
    var searchObj = search.load({
      id: searchId,
    });

    log.debug('searchObj', JSON.stringify(searchObj));

    return searchObj.runPaged({
      pageSize: searchPageSize,
    });
  }

  function fetchSearchResult(pagedData, pageIndex) {
    var searchPage = pagedData.fetch({
      index: pageIndex,
    });

    var results = new Array();

    searchPage.data.forEach(function (result) {
      var internalId = result.id;

      var amount = result.getValue({
        name: 'amount',
      });

      results.push({
        id: internalId,
        amount: amount,
      });
    });
    return results;
  }
});
