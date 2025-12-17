# Gaia Config Directory

This directory contains configuration files for the application when LLAMAEDGE_ENABLED is set to true.

When the application is first run as a binary and the external config directory doesn't exist, 
the contents of this directory will be copied to the external directory specified in the GAIA_CONFIG_PATH environment variable.

## Configuration Files

- config.json - Contains the server configuration
- info.json - Contains info about the server capabilities 