// NOTE: This shim is used to include a script from a parent directory.
// When building a zip for deploy, this script will be replaced with contents of the imported
// script.
module.exports = require('../scripts/common');
