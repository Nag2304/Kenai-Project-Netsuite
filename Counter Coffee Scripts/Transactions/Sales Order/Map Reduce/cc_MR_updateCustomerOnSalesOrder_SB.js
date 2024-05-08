/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: cc_MR_updateCustomerOnSalesOrder.js
 * Script:
 * Author           Date       Version               Remarks
 * mikewilliams  06.21.2023    1.00        Initial Creation of Script.
 */

/* global define,log*/

define(['N/record', 'N/search'], (record, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['custbody8', 'isnotempty', ''],
        'AND',
        ['custbody_ccc_ws_cust_updated', 'is', 'F'],
        'AND',
        ['custbody_celigo_etail_channel', 'anyof', '101'],
        'AND',
        ['custbody_celigo_shopify_store', 'anyof', '201'],
        'AND',
        ['mainline', 'is', 'T'],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'SO Internal ID' }),
        search.createColumn({ name: 'custbody8', label: 'Customer ID' }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------------- Map - Begin ------------------------------ */
  const map = (mapContext) => {
    const strLoggerTitle = 'Map Phase';
    log.debug(strLoggerTitle, '-------------<< Map - Entry >>-------------');
    try {
      // Read & parse the data
      const key = mapContext.key;
      const searchResult = JSON.parse(mapContext.value);
      log.debug(strLoggerTitle + ' After Parsing Results', [key, searchResult]);

      const customerId = parseInt(searchResult.values.custbody8);
      const customerIdCheck = isNaN(searchResult.values.custbody8);

      if (!customerIdCheck) {
        const salesOrderRecord = record.load({
          type: 'salesorder',
          id: key,
          isDynamic: true,
        });

        const shippingCarrier = salesOrderRecord.getValue({
          fieldId: 'shippingcarrier',
        });
        const shipMethod = salesOrderRecord.getValue({ fieldId: 'shipmethod' });

        salesOrderRecord.setValue({ fieldId: 'entity', value: customerId });
        salesOrderRecord.setValue({
          fieldId: 'custbody_ccc_ws_cust_updated',
          value: true,
        });

        if (shippingCarrier) {
          salesOrderRecord.setValue({
            fieldId: 'shippingcarrier',
            value: shippingCarrier,
          });
        }

        if (shipMethod) {
          salesOrderRecord.setValue({
            fieldId: 'shipmethod',
            value: shipMethod,
          });
        }

        const customerLookUpFields = search.lookupFields({
          type: search.Type.CUSTOMER,
          id: customerId,
          columns: ['custentity_customer_region', 'custentity_customer_type','custentity_customer_location'],
        });

        log.debug(strLoggerTitle, customerLookUpFields);

        let customerRegion;
        let customerType;
        let customerLocation;

        if (
          customerLookUpFields.custentity_customer_region &&
          customerLookUpFields.custentity_customer_region.length > 0
        ) {
          customerRegion =
            customerLookUpFields.custentity_customer_region[0].value;
          salesOrderRecord.setValue({
            fieldId: 'department',
            value: customerRegion,
          });
        }

        if (
          customerLookUpFields.custentity_customer_type &&
          customerLookUpFields.custentity_customer_type.length > 0
        ) {
          customerType = customerLookUpFields.custentity_customer_type[0].value;
          salesOrderRecord.setValue({ fieldId: 'class', value: customerType });
        }
        
if (
          customerLookUpFields.custentity_customer_location &&
          customerLookUpFields.custentity_customer_location.length > 0
        ) {
          customerLocation = customerLookUpFields.custentity_customer_location[0].value;
          salesOrderRecord.setValue({ fieldId: 'location', value: customerLocation });
        }
        
        
        

        // record.submitFields({
        //   type: record.Type.SALES_ORDER,
        //   id: key,
        //   values: {
        //     entity: customerId,
        //     custbody_ccc_ws_cust_updated: true,
        //     department: customerRegion,
        //     class: customerType,
        //   },
        // });
        salesOrderRecord.save();
      }

      log.audit(
        strLoggerTitle,
        'Sales Order Record Updated Successfully and it"s internal id is ' + key
      );
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
    log.debug(strLoggerTitle, '-------------<< Map - Exit >>-------------');
  };
  /* -------------------------------- Map - End ------------------------------- */
  //
  /* ------------------------- Summarize - Begin ------------------------- */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
    log.debug(
      strLoggerTitle,
      '-------------<< Summarize - Begin >>-------------'
    );
    try {
      log.audit(
        strLoggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        strLoggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        strLoggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(strLoggerTitle + ' failed to Execute', error);
    }
    log.debug(
      strLoggerTitle,
      '-------------<< Summarize - Exit >>-------------'
    );
  };
  /* ------------------------- Summarize - End ------------------------- */
  //
  /* ------------------------- Exports - Begin ------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.summarize = summarize;
  return exports;
  /* ------------------------- Exports - End ------------------------- */
});
