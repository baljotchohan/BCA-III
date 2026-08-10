# Manim Visuals Generator Toolkit

This directory contains standalone Python [Manim](https://github.com/3b1b/manim) scripts to generate high-resolution video animations for BCA 3rd Semester subjects.

## 1. Setup

Ensure you have Python 3 and FFmpeg installed:
```bash
brew install ffmpeg
pip install manim
```

## 2. Rendering Scenes

Run any of the following commands from the project root:

```bash
# Numerical Methods: Bisection Method Root Finding
manim -pqh manim_generator/generate_scenes.py BisectionMethodScene

# Data Structures: Binary Search Tree In-Order Traversal
manim -pqh manim_generator/generate_scenes.py BinarySearchTreeScene

# Machine Learning: Gradient Descent Loss Optimization
manim -pqh manim_generator/generate_scenes.py GradientDescentScene
```

## 3. Embedding Rendered Videos in BCA 3 Hub Notes

Copy the output `.mp4` or `.webm` file into your assets folder (e.g. `assets/visuals/bisection.mp4`) and write the following tag in your study notes or Admin portal:

```markdown
@[video:Bisection Method Convergence](assets/visuals/bisection.mp4)
```

Or use the built-in browser interactive visualizer without rendering any video:
```markdown
@[visual:numerical-bisection]
@[visual:ds-bst]
@[visual:ml-gradient-descent]
@[visual:arch-cpu-pipeline]
```
