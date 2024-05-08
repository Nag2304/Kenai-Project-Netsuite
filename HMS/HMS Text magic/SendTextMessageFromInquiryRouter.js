/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author Midware
 * @developer Francisco Alvarado Ferllini
 * @contact contact@midware.net
 */
define([
  'require',
  'exports',
  'N/log',
  'N/error',
  'N/http',
  '../Controllers/SendTextMessageFromInquiryController',
  '../../Constants/Constants',
], function (require, exports, log, error, http, controller, constants) {
  Object.defineProperty(exports, '__esModule', { value: true });
  function onRequest(pContext) {
    try {
      var eventMap = {}; //event router pattern design
      eventMap[http.Method.GET] = handleGet;
      eventMap[http.Method.POST] = handlePost;
      eventMap[pContext.request.method]
        ? eventMap[pContext.request.method](pContext)
        : httpRequestError();
      log.debug('On Request Function', eventMap);
    } catch (error) {
      pContext.response.write('Unexpected error. Detail: ' + error.message);
      handleError(error);
    }
  }
  exports.onRequest = onRequest;
  function handleGet(pContext) {
    if (
      pContext.request.parameters.method == constants.SUITELET.METODS.getOptions
    ) {
      log.debug('method', constants.SUITELET.METODS.getOptions);
      pContext.response.writeLine({
        output: controller.getOptions(pContext.request.parameters),
      });
    } else
      pContext.response.writeLine({
        output: JSON.stringify({ status: true, message: 'WRONG REQUEST' }),
      });
  }
  function handlePost(pContext) {
    if (
      pContext.request.parameters.method ==
      constants.SUITELET.METODS.sendMessage
    ) {
      log.debug('method', constants.SUITELET.METODS.sendMessage);
      pContext.response.writeLine({
        output: JSON.stringify(
          controller.sendMessage(pContext.request.parameters)
        ),
      });
    } else
      pContext.response.writeLine({
        output: JSON.stringify({ status: true, message: 'WRONG REQUEST' }),
      });
  }
  function httpRequestError() {
    throw error.create({
      name: 'MW_UNSUPPORTED_REQUEST_TYPE',
      message: 'Suitelet only supports GET and POST',
      notifyOff: true,
    });
  }
  function handleError(pError) {
    log.error({ title: 'Error', details: pError.message });
    log.error({ title: 'Stack', details: JSON.stringify(pError) });
  }
});
