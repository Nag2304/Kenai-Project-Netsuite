/**
 * Copyright (c) 2021 Ramp Tech Integrations Inc.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Ramp Tech Integrations Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Ramp Tech Integrations Inc.
 *
 * Version      Date            Author                Remarks
 * 1.01         08/08/2021      Lui Wong             Updates to accomodate shopify orders
 * 1.00         03/17/2021      Lui Wong             initial
 *
 **/

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/*global define,log*/
define(['N/record', 'N/runtime', 'N/search'], function (
  record,
  runtime,
  search
) {
  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function beforeSubmit(scriptContext) {
    try {
      var stLogTitle = 'beforeSubmit';

      var newRecord = scriptContext.newRecord;

      var intCreatedFrom = newRecord.getValue({ fieldId: 'createdfrom' });
      var salesOrderFields = search.lookupFields({
        type: 'salesorder',
        id: String(intCreatedFrom),
        columns: ['custbody_document_date'],
      });
      var documentDate = salesOrderFields.custbody_document_date;
      if (documentDate) {
        newRecord.setValue({
          fieldId: 'custbody_wdym_if_doc_date',
          value: documentDate,
        });
      }

      var lineItemCount = newRecord.getLineCount({ sublistId: 'item' });

      for (var index = 0; index < lineItemCount; index++) {
        var itemId = newRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });

        var itemType = newRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: index,
        });

        var itemFields;
        if (itemType == 'InvtPart') {
          itemFields = search.lookupFields({
            type: search.Type.INVENTORY_ITEM,
            id: itemId,
            columns: [
              'custitem_item_weight',
              'custitem_master_carton_gtin_number',
            ],
          });
        }

        var itemWeight = itemFields['custitem_item_weight'];

        var cartonGTINNumber = itemFields['custitem_master_carton_gtin_number'];

        if (!isEmpty(itemWeight)) {
          newRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_item_weight',
            value: itemWeight,
            line: index,
          });
        }

        if (!isEmpty(cartonGTINNumber)) {
          newRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wdym_carton_code',
            value: cartonGTINNumber,
            line: index,
          });
        }
      }
      //
    } catch (e) {
      log.error(stLogTitle, JSON.stringify(e));
      throw e.name + ': ' + e.message;
    }
  }

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function afterSubmit(scriptContext) {
    try {
      var stLogTitle = 'afterSubmit';

      log.debug(
        stLogTitle,
        'Processing record ID ' +
          scriptContext.newRecord.id +
          ', record type ' +
          scriptContext.newRecord.type +
          ' RunTime Execution Context ' +
          runtime.executionContext
      );

      AutoInvoice(scriptContext);
    } catch (e) {
      log.error(stLogTitle, JSON.stringify(e));
      throw e.name + ': ' + e.message;
    }
  }

  function AutoInvoice(scriptContext) {
    var stLogTitle = 'AutoInvoice';

    if (scriptContext.type == scriptContext.UserEventType.CREATE) {
      // if (scriptContext.type == scriptContext.UserEventType.EDIT)
      //  if (scriptContext.type == scriptContext.UserEventType.CREATE && runtime.executionContext == runtime.ContextType.USER_INTERFACE)

      var recItemFulfillment = scriptContext.newRecord;

      var stInvoiceNumber = recItemFulfillment.getValue(
        'custbody_invoice_nbr_from_tbf'
      );
      var intCreatedFrom = recItemFulfillment.getValue('createdfrom');
      if (isEmpty(intCreatedFrom)) {
        log.debug(
          stLogTitle,
          'Created from  is empty Not prcessing for invoice'
        );
        return;
      }
      var transactionType = searchtranstype(intCreatedFrom);
      log.debug('transactionType', transactionType);
      if (transactionType !== 'SalesOrd') {
        log.debug(
          stLogTitle,
          'Created from transaction Type is not a Sales order Cannot create invoice Existing script ' +
            transactionType
        );
        return;
      }
      var recInvoice = record.transform({
        fromType: record.Type.SALES_ORDER,
        fromId: intCreatedFrom,
        toType: record.Type.INVOICE,
      });
      var channel = recInvoice.getValue('custbody_channel');
      log.debug('channel ', channel);
      if (channel == 'Shopify Website') {
        log.debug('Invoice number from TBF ', 'Empty');
        //return;
        stInvoiceNumber = recInvoice.getValue('otherrefnum');
      }
      if (channel == 'TBF' || channel == 'Shopify Website') {
        recInvoice.setValue({
          fieldId: 'custbody_reference_number',
          value: stInvoiceNumber,
        });
        recInvoice.setValue({
          fieldId: 'externalid',
          value: stInvoiceNumber,
        });
      }
      var shipDate = recInvoice.getValue('shipdate');
      recInvoice.setValue({
        fieldId: 'trandate',
        value: shipDate,
      });
      var stInvoiceId = recInvoice.save({
        ignoreMandatoryFields: true,
      });

      log.audit(stLogTitle, 'Created Invoice ' + stInvoiceId);
    }
  }

  function isEmpty(stValue) {
    return (
      stValue === '' ||
      stValue == null ||
      stValue == undefined ||
      (stValue.constructor === Array && stValue.length == 0) ||
      (stValue.constructor === Object &&
        (function (v) {
          for (var k in v) return false;
          return true;
        })(stValue))
    );
  }

  function searchtranstype(tranid) {
    var stLogTitle = 'searchtranstype';
    log.debug(stLogTitle, 'Inside searchtranstype');

    var transactionSearchObj = search.create({
      type: 'transaction',
      filters: [
        ['internalid', 'anyof', tranid],
        'AND',
        ['mainline', 'is', 'T'],
      ],
      columns: [search.createColumn({ name: 'type', label: 'Type' })],
    });

    var transtype;
    var searchResult = transactionSearchObj.run().getRange(0, 1);
    log.debug('searchResult', searchResult);
    for (var i = 0; i < searchResult.length; i++) {
      transtype = searchResult[i].getValue({ name: 'type' });

      //  var recId = csr.save();
    }

    return transtype;
  }

  return {
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
