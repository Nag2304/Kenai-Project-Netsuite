/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: div_Module_checkDuplicatePONumber.js
 * Author           Date       Version               Remarks
 * nagendrababu  09th Aug 2024  1.00       Identify Duplicate PO# on Sales Order
 *
 */

/* global define,log */

define(['N/search'], function (search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------- Check Duplicate Number - Begin --------------------- */
  function checkDuplicateNumber(context) {
    var loggerTitle = 'Check Duplicate Number';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');

    var searchResultCount = 0;
    try {
      var currentRecord = context.currentRecord;

      var poNumber = currentRecord.getValue('otherrefnum');
      var customerId = currentRecord.getValue('entity');
      var customerFields = search.lookupFields({
        type: search.Type.CUSTOMER,
        id: customerId,
        columns: ['parent'],
      });

      var customerParentId = customerFields.parent.length
        ? customerFields.parent[0].value
        : '';

      log.debug(
        loggerTitle,
        ' PO Number: ' +
          poNumber +
          ' Customer ID: ' +
          customerId +
          ' Parent ID: ' +
          customerParentId
      );

      var customerFilters = ['name', 'anyof'];
      if (customerParentId) {
        var subCustomers = getSubCustomersforParent(customerParentId);
        for (var index = 0; index < subCustomers.length; index++) {
          customerFilters.push(subCustomers[index]);
        }
        subCustomers.push(customerParentId);
        customerFilters.push(customerParentId);
      } else {
        customerFilters.push(customerId);
      }
      log.debug(loggerTitle + ' Customer Filters', customerFilters);

      if (poNumber && customerId) {
        // Perform a saved search to check for duplicate PO numbers
        var salesorderSearchObj = search.create({
          type: search.Type.SALES_ORDER,
          filters: [
            ['mainline', 'is', 'T'],
            'AND',
            ['type', 'anyof', 'SalesOrd'],
            'AND',
            ['otherrefnum', 'equalto', poNumber],
            'AND',
            customerFilters,
          ],
          columns: [
            search.createColumn({
              name: 'otherrefnum',
              summary: 'GROUP',
            }),
          ],
        });

        searchResultCount = salesorderSearchObj.runPaged().count;
        log.debug(loggerTitle, ' Search Result Count: ' + searchResultCount);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
    return searchResultCount;
  }

  /* --------------------- Check Duplicate Number - End --------------------- */
  //
  /* ------------------------- Helper Functions - Begin ------------------------ */
  //
  /* *********************** Get Sub Customers For Parent - Begin *********************** */
  /**
   *
   * @param {Number} pCustId
   * @returns {Array}
   */
  function getSubCustomersforParent(pCustId) {
    var loggerTitle = 'Get Sub Customers For Parent';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    var customerIds = [];
    try {
      var customerSearchObj = search.create({
        type: 'customer',
        filters: [['internalidnumber', 'equalto', pCustId]],
        columns: [
          search.createColumn({
            name: 'entityid',
            join: 'subCustomer',
            label: 'Name',
          }),
          search.createColumn({
            name: 'internalid',
            join: 'subCustomer',
            label: 'Internal ID',
          }),
        ],
      });
      var searchResultCount = customerSearchObj.runPaged().count;
      log.debug(
        loggerTitle,
        'customerSearchObj result count:' + searchResultCount
      );
      customerSearchObj.run().each(function (result) {
        customerIds.push(
          result.getValue({
            name: 'internalid',
            join: 'subCustomer',
            label: 'Internal ID',
          })
        );
        return true;
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
    return customerIds;
  }
  /* *********************** Get Sub Customers For Parent - End *********************** */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.saveRecord = checkDuplicateNumber;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
