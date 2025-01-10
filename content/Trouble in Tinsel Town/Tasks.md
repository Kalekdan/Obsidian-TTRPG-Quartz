```tasks
# Only tasks that are not done, that is, which begin like this (but without the quotes):
#   '- [ ] ' or
#   '* [ ] ' or
#   '1. [ ] '
# Indented tasks are supported, but only single-line tasks.
not done
filter by function !task.file.path.includes('Templates')

show tree


# Hide fields I don't want to see
hide created date
hide backlink
hide postpone button

# Restrict to at most 100 tasks.
# If you ask Tasks to display many hundreds or thousands of tasks,
# Obsidian's editing performance really slows down.
limit 100

# Group and sort the output:
#group by function task.tags
#group by filename
sort by tag
sort by priority
sort by due reverse
sort by description

# hide most of the text and put in icons
short mode

# Optionally, ask Tasks to explain how it interpreted this query:
# explain
```
