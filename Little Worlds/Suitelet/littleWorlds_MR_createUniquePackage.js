/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: littleWorlds_MR_createUniquePackage.js
 * Script: Little Worlds | MR Create Unique Package
 * Author           Date       Version               Remarks
 * mikewilliams   09.17.2023    1.00       Initial Creation Of the Script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/runtime', 'N/file', 'N/record', 'N/format', 'N/search'], (
  runtime,
  file,
  record,
  format,
  search
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const packageDefinition = '2';
  const packageCartonIndex = 1;
  const packageLevelType = '2';
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  /**
   *
   * @param {object} inputContext
   * @returns {array}
   */
  const getInputData = (inputContext) => {
    const loggerTitle = 'Get Input Data';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    log.debug(loggerTitle, inputContext);

    // Retrieve the Script Parameter
    const currentScript = runtime.getCurrentScript();
    const fileId = String(
      currentScript.getParameter({
        name: 'custscript_lw_fileid',
      })
    );
    log.debug(loggerTitle, 'File ID: ' + fileId);

    return file.load({
      id: fileId,
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* -------------------------- Reduce Phase - Begin -------------------------- */
  /**
   *
   * @param {object} reduceContext
   * @returns {boolean}
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      log.debug(loggerTitle + ' Reduce Context Values', reduceContext.values);

      log.debug(
        loggerTitle + ' JSON Parse Reduce Context Values',
        JSON.parse(reduceContext.values)
      );

      const key = JSON.parse(reduceContext.values);
      let packageContentRecord = false;

      if (key > 0) {
        //
        /* ------------------------- Runtime Options - Begin ------------------------ */
        // Retrieve Current User
        const userObj = runtime.getCurrentUser();

        // Get today's date and time
        const now = new Date();
        const formattedDateTime = format.format({
          value: now,
          type: format.Type.DATETIME,
        });
        /* ------------------------- Runtime Options - End ------------------------ */
        //
        //
        /* -------------------- Retrieve Package Definition Type - Begin -------------------- */
        const packageDefinitionType = search.lookupFields({
          type: 'customrecord_sps_pack_type',
          id: packageDefinition,
          columns: [
            'custrecord_sps_pack_len',
            'custrecord_sps_pack_wth',
            'custrecord_sps_pack_hgt',
            'custrecord_sps_box_weight',
          ],
        });
        /* -------------------- Retrieve Package Definition Type - End -------------------- */
        //
        const userOptions = {};
        userOptions.userName = userObj.id;
        userOptions.formattedTime = formattedDateTime;
        userOptions.length = packageDefinitionType.custrecord_sps_pack_len;
        userOptions.width = packageDefinitionType.custrecord_sps_pack_wth;
        userOptions.height = packageDefinitionType.custrecord_sps_pack_hgt;
        userOptions.weight = packageDefinitionType.custrecord_sps_box_weight;
        userOptions.itemFullfillmentId = key;
        userOptions.packageId = 0;
        userOptions.totalQuantity = 0;
        userOptions.location = '';

        // Load the Item Fulfillment Record
        const itemFulfillmentRecord = record.load({
          type: record.Type.ITEM_FULFILLMENT,
          id: key,
        });

        const lineItemCount = itemFulfillmentRecord.getLineCount({
          sublistId: 'item',
        });

        for (let index = 0; index < lineItemCount; index++) {
          // Quantity
          const quantity = itemFulfillmentRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: index,
          });
          userOptions.totalQuantity += quantity;

          // Location
          const location = itemFulfillmentRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'location',
            line: index,
          });
          userOptions.location = location;
        }

        // Create Package Record
        userOptions.packageId = createPackageRecord(userOptions);

        for (let index = 0; index < lineItemCount; index++) {
          const lineItemOptions = {};
          // Item ID
          const itemId = itemFulfillmentRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: index,
          });
          lineItemOptions.itemId = itemId;

          // Quantity
          const quantity = itemFulfillmentRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: index,
          });
          lineItemOptions.quantity = quantity;

          // Item Fulfillment Internal ID
          lineItemOptions.itemFullfillmentId = key;

          // Line NUmber
          lineItemOptions.lineNumber = index;

          // Package ID
          lineItemOptions.packageId = userOptions.packageId;
          packageContentRecord = createPackageContentRecord(
            userOptions,
            lineItemOptions
          );
        }

        //

        if (packageContentRecord && userOptions.packageId > 0) {
          itemFulfillmentRecord.setValue({
            fieldId: 'custbody_lw_new_package_created',
            value: true,
          });
          const itemFulfillmentSave = itemFulfillmentRecord.save();
          log.audit(
            loggerTitle,
            ' Item Fulfillment Saved Successfully with Package Created ' +
              itemFulfillmentSave
          );
        }
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* --------------------------- Reduce Phase - End --------------------------- */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   *
   * @param {object} summarizeContext
   * @returns {boolean}
   */
  const summarize = (summarizeContext) => {
    const loggerTitle = 'Summarize Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      log.audit(
        loggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        loggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        loggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /* ***********************   createPackageRecord - Begin *********************** */
  /**
   *
   * @param {object} userOptions
   * @returns
   */
  const createPackageRecord = (userOptions) => {
    const loggerTitle = ' Create Package Record';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let packageId = 0;
    try {
      const formattedDateTime = userOptions.formattedTime;
      //
      /* --------------------- Custom Record Creation - Begin --------------------- */
      // Create Custom Record Creation
      const packageRecord = record.create({
        type: 'customrecord_sps_package',
        isDynamic: true,
      });
      packageRecord.setValue({
        fieldId: 'created',
        value: formattedDateTime,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_package_length',
        value: userOptions.length,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_package_width',
        value: userOptions.width,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_package_height',
        value: userOptions.height,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_package_level_type',
        value: packageLevelType,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_package_level_type',
        value: '2',
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_package_carton_index',
        value: packageCartonIndex,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_package_location',
        value: userOptions.location,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_pk_weight',
        value: userOptions.weight,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_pack_asn',
        value: userOptions.itemFullfillmentId,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_package_qty',
        value: userOptions.totalQuantity,
      });
      packageRecord.setValue({
        fieldId: 'custrecord_sps_package_box_type',
        value: packageDefinition,
      });
      packageId = packageRecord.save();
      log.audit(
        loggerTitle,
        ' Package Record Successfully Created and its ID: ' + packageId
      );
      /* --------------------- Custom Record Creation - End --------------------- */
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return packageId;
  };
  /* ***********************   createPackageRecord - End *********************** */
  //
  /* ***********************   createPackageContentRecord - Begin *********************** */
  /**
   *
   * @param {object} userOptions
   * @param {object} lineItemOptions
   */
  const createPackageContentRecord = (userOptions, lineItemOptions) => {
    const loggerTitle = ' Create Package Content Record ';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let saveFlag = false;
    try {
      const userName = userOptions.userName;
      const formattedDateTime = userOptions.formattedTime;
      //
      /* --------------------- Custom Record Creation - Begin --------------------- */
      // Create Custom Record Creation
      const packageContentRecord = record.create({
        type: 'customrecord_sps_content',
        isDynamic: true,
      });

      packageContentRecord.setValue({ fieldId: 'owner', value: userName });
      packageContentRecord.setValue({
        fieldId: 'created',
        value: formattedDateTime,
      });
      packageContentRecord.setValue({
        fieldId: 'lastmodified',
        value: formattedDateTime,
      });
      packageContentRecord.setValue({
        fieldId: 'custrecord_sps_content_item',
        value: lineItemOptions.itemId,
      });
      packageContentRecord.setValue({
        fieldId: 'custrecord_sps_content_qty',
        value: lineItemOptions.quantity,
      });
      packageContentRecord.setValue({
        fieldId: 'custrecord_sps_content_package',
        value: userOptions.packageId,
      });
      packageContentRecord.setValue({
        fieldId: 'custrecord_pack_content_fulfillment',
        value: lineItemOptions.itemFullfillmentId,
      });
      packageContentRecord.setValue({
        fieldId: 'custrecord_parent_pack_type',
        value: packageDefinition,
      });
      packageContentRecord.setValue({
        fieldId: 'custrecord_parent_pack_carton_index',
        value: packageCartonIndex,
      });
      packageContentRecord.setValue({
        fieldId: 'custrecord_sps_content_item_line_num',
        value: lineItemOptions.lineNumber,
      });
      const packageRecordId = packageContentRecord.save();
      log.debug(
        loggerTitle,
        ' Package Record Created Successfully' + packageRecordId
      );
      if (packageRecordId > 0) {
        saveFlag = true;
      }
      /* --------------------- Custom Record Creation - End --------------------- */
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return saveFlag;
  };
  /* ***********************  createPackageContentRecord - End *********************** */
  //
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
