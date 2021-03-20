# Fishing Simulator -- Final Project CS-174A-21W

Team members:  
Longyuan Gao(UID:005152795),  
Qi Xiao(UID:005171261)

 Our project is an interactive web fishing simulator in which user can catch fish by moving fishing rod around in a horde of fish in random motion. User gets score if he or she successfully catches a fish and user can also challenge him- or herself by completing game with stages of increasing difficulty.  
  
 It consists of two parts:  
 -The welcome page and  
 -The fishing pond

The welcome page gives a brief introduction of how to play the game and presents several types of fishes in the game.  
Welcome page is implemented by constructing a big cube as background and using "text" shape from text-demo to show letters.  
User can press 'B' on the keyboard to enter the fishing pond.  

In the fishing pond, user can see a square pond surrounded by wooden frames, grass and some animals. User can also observe several randamly moving fish under the water surface and a fishing rod above them.  
User can move fishing rod around by pressing keystrokes. A green fish hook at the end of the fishing rod will turn red it detects collision from some fish. At this moment, user can press 't' on the keyboard to catch fish.  
If a fish is caught successfully, a score board on the top right of the screen will be updated. And if all fish in the pond have been caught, game will enter next stage with incresing difficulty(Fish will faster and there will be more fish in the pond). 

Implementation of fish horde:    

Advanced feature implementation:  
The collision detection of fish and fishing hook is implemented by creating a bounding sphere class. Each bounding sphere has a collision radius. Two bouding shperes objects collides if sum of their collision radius is less than their distance. And we simply treat every fish and fishing hook as a bounding sphere object.    
Reference:  
code:  
"Shape_From_File" class from obj-file-demo.js,  
"Text_Line" class from text-demo.js,  
code for creating surface from surfaces-demo.js,  

3D objects:
Treasure, https://free3d.com/3d-model/aquarium-treasure-chest-v1--718043.html  
crab, https://free3d.com/3d-model/-crab-v2--922900.html  
fish(2), https://free3d.com/3d-model/fish-v1--996288.html  
fish(3), https://free3d.com/3d-model/3d-fish-model-low-poly-63627.html  
fish(1), https://free3d.com/3d-model/tiger-shark-v1--102779.html  
rock, https://free3d.com/3d-model/2-stones-84389.html  
grass, https://free3d.com/3d-model/high-quality-grass-78178.html  
frog, https://free3d.com/3d-model/banjofrog-v1--699349.html  
dirt texture, https://www.artstation.com/artwork/oO9oOw  
wood texture, https://www.dreamstime.com/stock-illustration-beautiful-seamless-background-realistic-texture-wooden-boards-hand-drawn-natural-image93802343  
welcome page background texture, https://www.mysensorium.ru/product/ler06965-igrovoy-nabor-obitateli-okeana-osminog



