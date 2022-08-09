module.exports = {
  stories: ['../app/components/**/*.stories.?(ts|tsx|js|jsx)'],
  addons: [
    // '@storybook/addon-ondevice-notes',
    '@storybook/addon-ondevice-controls',
    // TypeError: api.store().getStoryAndParameters is not a function. (In 'api.store().getStoryAndParameters(this.state.selection.kind, this.state.selection.story)', 'api.store().getStoryAndParameters' is undefined) (node_modules/@storybook/addon-ondevice-backgrounds/dist/BackgroundPanel.js:62:21)
    // '@storybook/addon-ondevice-backgrounds',
    '@storybook/addon-ondevice-actions',
  ],
};
