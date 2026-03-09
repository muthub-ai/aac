outputPath = 'build/microsite/output'

inputFiles = [
    [file: 'src/docs/index.adoc', formats: ['html5']],
]

taskInputsDirs = ['src/docs']
taskInputsFiles = []

// PlantUML configuration
plantUmlDir = 'src/docs/diagrams'
