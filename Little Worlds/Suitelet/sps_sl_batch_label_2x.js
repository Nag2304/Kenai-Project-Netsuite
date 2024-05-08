/**
 *@NApiVersion 2.0
 *@NModuleScope SameAccount
 *@NScriptType Suitelet
 */
define([
  'require',
  'exports',
  'N/error',
  'N/log',
  'N/config',
  'N/record',
  'N/task',
  './lib/sps_lib_packdata',
  './lib/sps_lib_create_if_obj',
  './lib/sps_lib_label',
  './lib/sps_lib_label_api',
  './lib/sps_lib_label_removal',
], function (
  require,
  exports,
  error,
  log,
  config,
  record,
  task,
  packdata,
  createIfObj,
  label,
  spsapi,
  removeLabel
) {
  var NUM_DEPLOYMENTS = 11;
  function onRequest(ctx) {
    var logDebugXmlFile = true;
    var maxLabelRequest = 75;
    var paramObj = ctx.request.parameters;
    var itemFulfillmentStr = paramObj.id || paramObj.param1;
    var packageId = paramObj.packid;
    var packageSource = paramObj.packageSource;
    var packStructure = paramObj.asnType;
    var rowLimit = 225;
    if (paramObj.rowLimitOverride) {
      var rowLimitInt = parseInt(paramObj.rowLimitOverride, 10);
      if (rowLimitInt > 0) {
        rowLimit = rowLimitInt;
        log.debug(
          'Manual Row Limit Override',
          'New row limit param passed with a limit of ' + rowLimit
        );
      }
    }
    log.debug(
      'Starting Script',
      'For Item Fulfillment: ' +
        itemFulfillmentStr +
        '.  Will debug file be placed in SPS Debug folder for Suitelet: ' +
        logDebugXmlFile
    );
    if (packageId) {
      log.debug(
        'Additional Parameter found',
        'Script executing for only Package: ' + packageId
      );
    }
    var companyConfigRecord = config.load({
      type: config.Type.COMPANY_PREFERENCES,
    });
    var labelSearchId = companyConfigRecord.getValue({
      fieldId: 'custscript_sps_label_api_search',
    });
    var compLabelSettings = label.getLabelRecObj();
    if (!compLabelSettings) {
      throw error.create({
        name: 'MISSING_REQUIRED_PARAM',
        message: 'Missing Company Label Setup Record. Contact SPS Support',
      });
    }
    var token = compLabelSettings.custrecord_sps_label_login_token;
    if (typeof itemFulfillmentStr === 'string') {
      var itemFulfillmentArr = itemFulfillmentStr.split(',');
      if (itemFulfillmentArr.length > 0) {
        log.debug(
          'Pacejet Package Source Log',
          'Package Structure requested: ' + packStructure
        );
        var packageObj = packdata.getArray(
          itemFulfillmentArr,
          packageId,
          packageSource,
          packStructure
        );
        var packValidationMessage = packdata.validateSpsJson(packageObj);
        if (packValidationMessage) {
          throw error.create({
            name: 'PACKAGE VALIDATION MISSING',
            message: 'Error from Package Validation: ' + packValidationMessage,
            notifyOff: true,
          });
        }
        var labelCount = packageObj.length;
        // Log results for trouble shooting
        log.debug('packages', JSON.stringify(packageObj));
        // now gather array of all required labels
        if (labelCount > rowLimit) {
          var taskId = '';
          for (
            var deploymentCounter = 0;
            deploymentCounter < NUM_DEPLOYMENTS;
            deploymentCounter++
          ) {
            try {
              var mapReduceTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_sps_mr_batch_label',
                deploymentId:
                  'customdeploy_sps_mr_batch_label_' + deploymentCounter,
                params: {
                  custscript_sps_mr_batch_label_json: {
                    itemFulfillmentArr: itemFulfillmentArr,
                    rowLimit: rowLimit,
                    maxLabelRequest: maxLabelRequest,
                    packageSource: packageSource,
                    packStructure: packStructure,
                  },
                },
              });
              taskId = mapReduceTask.submit();
              break;
            } catch (taskScheduleError) {
              if (taskScheduleError.name !== 'MAP_REDUCE_ALREADY_RUNNING') {
                throw taskScheduleError;
              }
            }
          }
          if (taskId) {
            record.submitFields({
              type: record.Type.ITEM_FULFILLMENT,
              id: itemFulfillmentArr[0],
              values: {
                custbody_sps_lbl_msg:
                  'Label Generation passed to Map Reduce script',
              },
              options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
              },
            });
            ctx.response.write(
              'Creation of Shipping Labels has been scheduled. Please see Map Reduce Script Status for notice of completion.'
            );
            log.debug(
              'Map Reduce Handoff',
              'Creation of Shipping Labels has been scheduled. Please see Map Reduce Script Status for notice of completion.'
            );
          } else {
            ctx.response.write(
              'Unable to schedule since all script deployments are in use for SPS MR Batch Labels. Please see Map Reduce Script Status and retry when a deployment is available for SPS MR Batch Labels.'
            );
          }
          return;
        }
        // New: remove existing Label Files before creating new PDFs
        removeLabel.findRemoveExistingLabels(itemFulfillmentArr, packageId);
        var itemFulfillmentObj = createIfObj.getIfObj(
          itemFulfillmentArr,
          labelSearchId,
          packageSource
        );
        var itemFulfillmentResults = itemFulfillmentObj.ifResults;
        log.debug('ifObj', JSON.stringify(itemFulfillmentResults));
        var results = label.getLabelResultObj(
          itemFulfillmentArr,
          itemFulfillmentResults,
          packageObj,
          compLabelSettings,
          maxLabelRequest
        );
        var labelXmlArr = results.labelArr;
        // const completeLabelObj = results.responseArr  -- Used for Testing
        var labelBatchCount_1 = Math.ceil(labelCount / maxLabelRequest);
        var firstKey = Object.keys(itemFulfillmentResults);
        var labelUid_1 =
          itemFulfillmentResults[firstKey[0]].LabelUID ||
          label.getDefaultLabelUID(itemFulfillmentArr[0]) ||
          false;
        // TODO: Move error messaging to label api lib file
        if (!labelUid_1) {
          var noLabelMessage =
            'No customer label is defined. Please select one in the Package Contents tab, or setup a new label in the SPS Commerce center.';
          record.submitFields({
            type: record.Type.ITEM_FULFILLMENT,
            id: itemFulfillmentArr[0],
            values: {
              custbody_sps_lbl_msg: noLabelMessage,
              custbody_sps_batched_print_com: false,
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true,
            },
          });
          throw error.create({
            name: 'PDF_GENERATION_ERROR',
            message: noLabelMessage,
            notifyOff: true,
          });
        }
        if (labelXmlArr.length !== labelBatchCount_1) {
          var incompleteBatchMessage =
            'One or more of the requested labels are invalid.';
          throw error.create({
            name: 'PDF_GENERATION_ERROR',
            message: incompleteBatchMessage,
            notifyOff: true,
          });
        }
        var labelApiToken_1 = token;
        var currIfId_1 = itemFulfillmentArr[0];
        // const resultStr = JSON.stringify(completeLabelObj, null, ' ') -- Used for Testing
        var currentLabelCount_1;
        labelXmlArr.forEach(function (labelXml, index) {
          var labelReqXML = labelXml;
          currentLabelCount_1 = index + 1;
          var futureFileName = label.spsBuildFileName(
            currIfId_1,
            currentLabelCount_1,
            labelBatchCount_1,
            packageId
          );
          if (logDebugXmlFile) {
            label.logXmlRecordForTesting(labelReqXML, futureFileName);
          }
          var labelObj;
          try {
            labelObj = spsapi.spsLabelApiRequest(
              labelReqXML,
              labelApiToken_1,
              labelUid_1,
              futureFileName
            );
          } catch (labelApiError) {
            if (packageId) {
              log.debug('labelApiError', labelApiError);
              ctx.response.write(
                '\n                <h3>Unable to Create Label</h3>\n                <p>' +
                  labelApiError.message +
                  ".</p>\n                <p>Click your browser's Back button to return to the transaction.</p>\n            "
              );
              return;
            } else {
              record.submitFields({
                type: record.Type.ITEM_FULFILLMENT,
                id: currIfId_1,
                values: {
                  custbody_sps_lbl_msg: labelApiError.message,
                  custbody_sps_batched_print_com: false,
                },
                options: {
                  enableSourcing: false,
                  ignoreMandatoryFields: true,
                },
              });
              throw labelApiError;
            }
          }
          var labelFileId = labelObj.fileId;
          record.attach({
            record: {
              type: 'file',
              id: labelFileId,
            },
            to: {
              type: record.Type.ITEM_FULFILLMENT,
              id: currIfId_1,
            },
          });
          log.debug('Label Debug File ID', labelFileId);
          if (packageId) {
            // if single package request, write file to user and log for exit of script
            log.debug(
              'Ending Script',
              'Finished request for packge id ' +
                packageId +
                '. Label saved to IF in File folder under communications tab.'
            );
            ctx.response.writeFile({ file: labelObj.labelFile });
          }
        });
        if (packageId) {
          return;
        }
        // TODO: update logging for this before go live
        log.debug('Label UID: ', labelUid_1);
        var finalMessage =
          'Finished Creating Label(s) for ' +
          currIfId_1 +
          '. ' +
          currentLabelCount_1 +
          ' Label(s) PDF are available for print/download on the Communication -> Files sublist. ';
        ctx.response.write(finalMessage);
        record.submitFields({
          type: record.Type.ITEM_FULFILLMENT,
          id: currIfId_1,
          values: {
            custbody_sps_lbl_msg: finalMessage,
            custbody_sps_batched_print_com: true,
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
        log.debug('Ending Script', finalMessage);
      } else {
        throw error.create({
          name: 'MISSING_REQUIRED_QUERY_PARAM',
          message: 'Query parameter itemFulfillmentIds not specified.',
        });
      }
    } else {
      throw error.create({
        name: 'MISSING_REQUIRED_QUERY_PARAM',
        message: 'Query parameter itemFulfillmentIds not specified.',
      });
    }
  }
  return { onRequest: onRequest };
});
