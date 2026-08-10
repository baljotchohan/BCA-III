"""
BCA 3 Hub — Manim Python Video Generator Suite
Use this script with Manim (3b1b or Manim Community) to render offline HD .mp4 / .webm animations.

Requirements:
    pip install manim
    brew install ffmpeg (on macOS)

Render Commands:
    # 1. Bisection Method (Numerical Methods)
    manim -pqh generate_scenes.py BisectionMethodScene

    # 2. Binary Search Tree (Data Structures)
    manim -pqh generate_scenes.py BinarySearchTreeScene

    # 3. Gradient Descent (Machine Learning)
    manim -pqh generate_scenes.py GradientDescentScene
"""

from manim import *

class BisectionMethodScene(Scene):
    """Visualizes Bisection Method root finding for f(x) = x^2 - 2 on [1, 2]."""
    def construct(self):
        title = Title("Bisection Method: Root Finding", color=BLUE)
        formula = MathTex(r"f(x) = x^2 - 2 = 0 \implies \alpha = \sqrt{2} \approx 1.4142").scale(0.8)
        formula.next_to(title, DOWN)

        self.play(Write(title), Write(formula))
        self.wait(1)

        # Coordinate axes
        axes = Axes(
            x_range=[0, 3, 0.5],
            y_range=[-3, 5, 1],
            x_length=7,
            y_length=4.5,
            axis_config={"color": GREY_B, "include_numbers": True},
        ).shift(DOWN * 0.8)

        curve = axes.plot(lambda x: x**2 - 2, color=YELLOW, x_range=[0.5, 2.5])
        curve_label = MathTex(r"y = x^2 - 2", color=YELLOW).scale(0.7).next_to(curve, UP)

        self.play(Create(axes), Create(curve), FadeIn(curve_label))
        self.wait(1)

        # Initial Interval [a, b] = [1, 2]
        a_val, b_val = 1.0, 2.0
        dot_a = Dot(axes.c2p(a_val, a_val**2 - 2), color=BLUE)
        dot_b = Dot(axes.c2p(b_val, b_val**2 - 2), color=RED)
        label_a = MathTex("a=1.0", color=BLUE).scale(0.6).next_to(dot_a, DOWN)
        label_b = MathTex("b=2.0", color=RED).scale(0.6).next_to(dot_b, UP)

        self.play(FadeIn(dot_a), FadeIn(dot_b), Write(label_a), Write(label_b))

        # Iteration 1: m = 1.5
        m_val = (a_val + b_val) / 2
        dot_m = Dot(axes.c2p(m_val, m_val**2 - 2), color=GOLD)
        label_m = MathTex("m_1=1.5", color=GOLD).scale(0.6).next_to(dot_m, RIGHT)

        self.play(TransformFromCopy(dot_a, dot_m), Write(label_m))
        self.wait(2)


class BinarySearchTreeScene(Scene):
    """Visualizes BST insertion and In-Order traversal."""
    def construct(self):
        title = Title("Binary Search Tree: In-Order Traversal", color=GREEN)
        self.play(Write(title))

        # Root and Child Nodes
        root_circle = Circle(radius=0.4, color=WHITE, fill_opacity=0.3, fill_color=BLUE).shift(UP * 1.5)
        root_text = MathTex("50").move_to(root_circle.get_center())
        root_grp = VGroup(root_circle, root_text)

        left_circle = Circle(radius=0.4, color=WHITE, fill_opacity=0.3, fill_color=BLUE).shift(LEFT * 2 + DOWN * 0.2)
        left_text = MathTex("30").move_to(left_circle.get_center())
        left_grp = VGroup(left_circle, left_text)

        right_circle = Circle(radius=0.4, color=WHITE, fill_opacity=0.3, fill_color=BLUE).shift(RIGHT * 2 + DOWN * 0.2)
        right_text = MathTex("70").move_to(right_circle.get_center())
        right_grp = VGroup(right_circle, right_text)

        edge_l = Line(root_circle.get_bottom(), left_circle.get_top(), color=GREY)
        edge_r = Line(root_circle.get_bottom(), right_circle.get_top(), color=GREY)

        self.play(Create(root_grp))
        self.play(Create(edge_l), Create(left_grp), Create(edge_r), Create(right_grp))
        self.wait(1)

        # In-Order animation (Left -> Root -> Right)
        for grp in [left_grp, root_grp, right_grp]:
            self.play(grp[0].animate.set_fill(GOLD, opacity=0.8), run_time=0.6)
            self.play(grp[0].animate.set_fill(BLUE, opacity=0.3), run_time=0.4)

        self.wait(2)


class GradientDescentScene(Scene):
    """Visualizes 2D Loss Curve and Gradient Descent Steps."""
    def construct(self):
        title = Title("Gradient Descent: Parameter Optimization", color=PURPLE)
        rule = MathTex(r"w_{t+1} = w_t - \eta \nabla L(w_t)").scale(0.8).next_to(title, DOWN)
        self.play(Write(title), Write(rule))

        axes = Axes(
            x_range=[-1, 5, 1],
            y_range=[0, 6, 1],
            x_length=7,
            y_length=4,
            axis_config={"color": GREY_B},
        ).shift(DOWN * 0.8)

        loss_curve = axes.plot(lambda w: 0.4 * (w - 2)**2 + 0.5, color=PURPLE, x_range=[-0.5, 4.5])
        self.play(Create(axes), Create(loss_curve))

        # Ball starting at w = 4.0
        w_start = 4.0
        ball = Dot(axes.c2p(w_start, 0.4 * (w_start - 2)**2 + 0.5), color=GOLD, radius=0.15)
        self.play(FadeIn(ball))

        # Descent steps
        curr_w = w_start
        lr = 0.4
        for _ in range(4):
            grad = 0.8 * (curr_w - 2)
            next_w = curr_w - lr * grad
            next_pos = axes.c2p(next_w, 0.4 * (next_w - 2)**2 + 0.5)
            self.play(ball.animate.move_to(next_pos), run_time=0.8)
            curr_w = next_w

        self.wait(2)
