import numpy as np
import matplotlib.pyplot as plt
x=np.linspace(-4,4,500)
y=np.exp(-0.35*x*x)*(1+0.18*np.cos(8*x))
plt.plot(x,y); plt.title("MathHike Mountain"); plt.xlabel("trail x"); plt.ylabel("height"); plt.show()
