// constants/colors.js — design tokens matching the SRS spec
const Colors = {
  // Backgrounds
  bg:       '#0d1117',   // main dark background
  surface:  '#161b22',   // card / panel background
  border:   '#30363d',   // subtle borders

  // Accent
  accent:   '#58a6ff',   // primary blue (links, buttons, highlights)
  accentDim:'#1f6feb',   // darker blue for pressed states

  // Text
  textPrimary:   '#e6edf3',
  textSecondary: '#8b949e',
  textMuted:     '#484f58',

  // Status colours for tickets
  priorityHigh:   '#f85149',   // red
  priorityMedium: '#d29922',   // yellow
  priorityLow:    '#3fb950',   // green

  // Kanban column header tints
  colTodo:       '#30363d',
  colInProgress: '#1f3a5f',
  colReview:     '#3d2b00',
  colDone:       '#0f3323',

  // Misc
  white: '#ffffff',
  error: '#f85149',
  success: '#3fb950',
};

export default Colors;
