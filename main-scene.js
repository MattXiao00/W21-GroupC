import {tiny, defs} from './examples/common.js';
                                                  // Pull these names into this module's scope for convenience:
const { Vector, Vector3, vec, vec3, vec4, color, hex_color,Matrix, Mat4, Light, Shape, Material, Shader, Texture, Scene, 
        Canvas_Widget, Code_Widget, Text_Widget } = tiny;


const {Cube, Axis_Arrows, Textured_Phong, Circle} = defs;



const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo;
import { Axes_Viewer, Axes_Viewer_Test_Scene } 
  from "./examples/axes-viewer.js"
import { Inertia_Demo, Collision_Demo }
  from "./examples/collisions-demo.js"
import { Many_Lights_Demo }
  from "./examples/many-lights-demo.js"
import { Obj_File_Demo }
  from "./examples/obj-file-demo.js"
import { Scene_To_Texture_Demo }
  from "./examples/scene-to-texture-demo.js"
import { Surfaces_Demo }
  from "./examples/surfaces-demo.js"
import { Text_Demo }
  from "./examples/text-demo.js"
import { Transforms_Sandbox }
  from "./examples/transforms-sandbox.js"

Object.assign( defs,
                     { Axes_Viewer, Axes_Viewer_Test_Scene },
                     { Inertia_Demo, Collision_Demo },
                     { Many_Lights_Demo },
                     { Obj_File_Demo },
                     { Scene_To_Texture_Demo },
                     { Surfaces_Demo },
                     { Text_Demo },
                     { Transforms_Sandbox } );

//Class for loading .Obj File

export class Shape_From_File extends Shape
{                                   // **Shape_From_File** is a versatile standalone Shape that imports
                                    // all its arrays' data from an .obj 3D model file.
    constructor( filename )
    { super( "position", "normal", "texture_coord" );
        // Begin downloading the mesh. Once that completes, return
        // control to our parse_into_mesh function.
        this.load_file( filename );
    }
    load_file( filename )
    {                             // Request the external file and wait for it to load.
        // Failure mode:  Loads an empty shape.
        return fetch( filename )
            .then( response =>
            { if ( response.ok )  return Promise.resolve( response.text() )
            else                return Promise.reject ( response.status )
            })
            .then( obj_file_contents => this.parse_into_mesh( obj_file_contents ) )
            .catch( error => { this.copy_onto_graphics_card( this.gl ); } )
    }
    parse_into_mesh( data )
    {                           // Adapted from the "webgl-obj-loader.js" library found online:
        var verts = [], vertNormals = [], textures = [], unpacked = {};

        unpacked.verts = [];        unpacked.norms = [];    unpacked.textures = [];
        unpacked.hashindices = {};  unpacked.indices = [];  unpacked.index = 0;

        var lines = data.split('\n');

        var VERTEX_RE = /^v\s/;    var NORMAL_RE = /^vn\s/;    var TEXTURE_RE = /^vt\s/;
        var FACE_RE = /^f\s/;      var WHITESPACE_RE = /\s+/;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var elements = line.split(WHITESPACE_RE);
            elements.shift();

            if      (VERTEX_RE.test(line))   verts.push.apply(verts, elements);
            else if (NORMAL_RE.test(line))   vertNormals.push.apply(vertNormals, elements);
            else if (TEXTURE_RE.test(line))  textures.push.apply(textures, elements);
            else if (FACE_RE.test(line)) {
                var quad = false;
                for (var j = 0, eleLen = elements.length; j < eleLen; j++)
                {
                    if(j === 3 && !quad) {  j = 2;  quad = true;  }
                    if(elements[j] in unpacked.hashindices)
                        unpacked.indices.push(unpacked.hashindices[elements[j]]);
                    else
                    {
                        var vertex = elements[ j ].split( '/' );

                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);

                        if (textures.length)
                        {   unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 0]);
                            unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 1]);  }

                        unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 0]);
                        unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 1]);
                        unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 2]);

                        unpacked.hashindices[elements[j]] = unpacked.index;
                        unpacked.indices.push(unpacked.index);
                        unpacked.index += 1;
                    }
                    if(j === 3 && quad)   unpacked.indices.push( unpacked.hashindices[elements[0]]);
                }
            }
        }
        {
            const { verts, norms, textures } = unpacked;
            for( var j = 0; j < verts.length/3; j++ )
            {
                this.arrays.position     .push( vec3( verts[ 3*j ], verts[ 3*j + 1 ], verts[ 3*j + 2 ] ) );
                this.arrays.normal       .push( vec3( norms[ 3*j ], norms[ 3*j + 1 ], norms[ 3*j + 2 ] ) );
                this.arrays.texture_coord.push( vec( textures[ 2*j ], textures[ 2*j + 1 ] ) );
            }
            this.indices = unpacked.indices;
        }
        this.normalize_positions( false );
        this.ready = true;
    }
    draw( context, program_state, model_transform, material )
    {               // draw(): Same as always for shapes, but cancel all
        // attempts to draw the shape before it loads:
        if( this.ready )
            super.draw( context, program_state, model_transform, material );
    }
}
export class Text_Line extends Shape {                           // **Text_Line** embeds text in the 3D world, using a crude texture
                                                                 // method.  This Shape is made of a horizontal arrangement of quads.
                                                                 // Each is textured over with images of ASCII characters, spelling
                                                                 // out a string.  Usage:  Instantiate the Shape with the desired
                                                                 // character line width.  Then assign it a single-line string by calling
                                                                 // set_string("your string") on it. Draw the shape on a material
                                                                 // with full ambient weight, and text.png assigned as its texture
                                                                 // file.  For multi-line strings, repeat this process and draw with
                                                                 // a different matrix.
    constructor(max_size) {
        super("position", "normal", "texture_coord");
        this.max_size = max_size;
        var object_transform = Mat4.identity();
        for (var i = 0; i < max_size; i++) {                                       // Each quad is a separate Square instance:
            defs.Square.insert_transformed_copy_into(this, [], object_transform);
            object_transform.post_multiply(Mat4.translation(1.5, 0, 0));
        }
    }

    set_string(line, context) {           // set_string():  Call this to overwrite the texture coordinates buffer with new
        // values per quad, which enclose each of the string's characters.
        this.arrays.texture_coord = [];
        for (var i = 0; i < this.max_size; i++) {
            var row = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) / 16),
                col = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) % 16);

            var skip = 3, size = 32, sizefloor = size - skip;
            var dim = size * 16,
                left = (col * size + skip) / dim, top = (row * size + skip) / dim,
                right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

            this.arrays.texture_coord.push(...Vector.cast([left, 1 - bottom], [right, 1 - bottom],
                [left, 1 - top], [right, 1 - top]));
        }
        if (!this.existing) {
            this.copy_onto_graphics_card(context);
            this.existing = true;
        } else
            this.copy_onto_graphics_card(context, ["texture_coord"], false);
    }
}
//Class for collision object
class collision_object{
    constructor(location_matrix_input, collision_radius_input) {
        this.location_matrix = location_matrix_input;
        this.collision_radius = collision_radius_input;
    }

    get_location_matrix(){
        return this.location_matrix;
    }

    set_location_matrix(location_matrix_input){
        this.location_matrix = location_matrix_input;
    }

    get_radius(){
        return this.collision_radius;
    }

    if_collision(collision_object_two){
        let location_1 = this.location_matrix.times(vec4(0,0,0,1));
        let location_2 = collision_object_two.get_location_matrix().times(vec4(0,0,0,1));
        let difference = location_1.minus(location_2);
        let distance = difference.norm();
        return distance <= this.collision_radius + collision_object_two.get_radius();
    }
}

export class Final_Project extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        //Pond Creation
        const initial_corner_point = vec3(-1, -1, 0);
        // These two callbacks will step along s and t of the first sheet:
        const row_operation = (s, p) => p ? Mat4.translation(0, .2, 0).times(p.to4(1)).to3()
            : initial_corner_point;
        const column_operation = (t, p) => Mat4.translation(.2, 0, 0).times(p.to4(1)).to3();
        // These two callbacks will step along s and t of the second sheet:
        const row_operation_2 = (s, p) => vec3(-1, 2 * s - 1, Math.random() / 2);
        const column_operation_2 = (t, p, s) => vec3(2 * t - 1, 2 * s - 1, Math.random() / 2);

        this.shapes = {
            torus: new defs.Torus(15, 15),
            box_1: new Cube(),
            sheet: new defs.Grid_Patch(10, 10, row_operation, column_operation),
            sheet2: new defs.Grid_Patch(10, 10, row_operation_2, column_operation_2),
            fish1: new Shape_From_File( "assets/19414_Tiger_Shark_v1.obj" ),
            fish2: new Shape_From_File("assets/fish2.obj"),
            fish3: new Shape_From_File("assets/fish3.obj"),
            frame: new Shape_From_File("assets/frame1.obj"),
            plant1: new Shape_From_File("assets/High Grass.obj"),
            crab: new Shape_From_File("assets/crab.obj"),
            frog: new Shape_From_File("assets/frog.obj"),
            stone: new Shape_From_File("assets/stone1.obj"),
            fish_hook: new defs.Subdivision_Sphere(4),
            fishing_rod: new Shape_From_File("assets/fishing_rod.obj"),
            level_clear: new Shape_From_File("assets/lc5.obj"),
            text: new Text_Line(30), //Maximun line length is 30
            secret: new Shape_From_File("assets/gold.obj"),
        };

        // *** Materials

         this.materials = {
            secret: new Material(new defs.Textured_Phong(), {
                ambient:1,
                texture: new Texture("assets/gold.jpg")
            }),

            stone_material:new Material(new Textured_Phong(), {
                ambient:0.8 ,specularity:0.1,texture: new Texture("assets/stone.jpg")//texture: new Texture("assets/crab.jpg")
            }),
            frog_material: new Material(new Textured_Phong(), {
                ambient:0.2 ,specularity:0.5,color: color(0,1,0,1),texture: new Texture("assets/frog.jpg")//texture: new Texture("assets/crab.jpg")
            }),
            crab_material: new Material(new Textured_Phong(), {
                ambient: 0.5 ,specularity:0.5, color: color(2200/255,95/255,71/255,1),//texture: new Texture("assets/crab.jpg")
            }),
            grass_material: new Material(new Textured_Phong(), {
                ambient: 1. ,specularity:1, texture: new Texture("assets/Grass.png")
            }),
            ground_material: new Material(new Textured_Phong(), {
                ambient: 0.7 ,specularity:0, texture: new Texture("assets/ground_texture.jpeg")
            }),
            pond_material: new Material(new Textured_Phong(), {
                ambient: 0.5, 
                specularity: 0.8, 
                color: color(0,0,1,0.3),
            }),
            frame_material: new Material(new Textured_Phong(), {
                ambient: 0.4, 
                specularity: 0.8, 
                 color: color(150/255,75/255,0,1),

            }),
            fish_hook_material: new Material(new Textured_Phong(), {
                ambient: 0.4,
                color: color(0,1,0,1),
            }),
            phong: new Material(new defs.Textured_Phong(), {
                color: color(0.5,0.5,0.2,1),
            }),
            showcase_2: new Material(new defs.Textured_Phong(), {
                 ambient:0.7,
                color: color(0,0,1,1),
               
            }),
            level_clear: new Material(new defs.Textured_Phong(),
            {
                ambient:0.4,specularity:1,
                color: color(0,0,1,1),
            }),
            fish_2: new Material(new defs.Textured_Phong(), {
                color: color(0,0.2,1,1),
            }),

            fish_3: new Material(new defs.Textured_Phong(), {
                color: color(1,215/256,0,1),
            }),

             text_material: new Material(new Textured_Phong(), {
                 ambient: 1.0,
                 texture: new Texture("assets/text.png")
             }),
             show_case_1:new Material(new defs.Textured_Phong(), {
                 ambient: 1,
                color: color(0.5,0.5,0.2,1),
            }),
            showcase_3: new Material(new defs.Textured_Phong(), {
                ambient:1,
                color: color(1,215/256,0,1),
            }),
            showcase_4: new Material(new defs.Textured_Phong(), {

                ambient:0.6,
                texture: new Texture("assets/bg.jpeg")
            }),
            
        }

//=================================================VARIABLE DECLARATIONS=================================================
        //Initial_camera_location
        this.initial_camera_location = Mat4.look_at(vec3(0, 30, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        //Control of Fish hoard
        this.fish_amount = 3;
        this.uncaught_fish_amount = this.fish_amount;
        this.random_set = false;
        this.random_numbers = new Array(this.fish_amount);
        this.random_numbers_y = new Array(this.fish_amount);       
        this.hoard_x_coord = new Array(this.fish_amount);
        this.hoard_y_coord = new Array(this.fish_amount);
        this.catched_time = new Array(this.fish_amount);//record when is the fish caught

        //Catching detection/control
        this.catched = new Array(this.fish_amount);
        this.catching = false;   //when t is pressed, this var becomes true for 0.5s.
        this.recorded_catching_time = 0; //record the time that catching happens.
        this.record_catching_time = true; //flag for recording time.
       
       
        //Color of fish hook
        this.fish_hook_color = 0; //0 means green and 1 means red

        //Initial position for hook
        this.fish_hook_x = 0;//max:9,min:-9
        this.fish_hook_y = 0;//max:9,min:-9
        this.rod_pos_record = vec(0,0);
        this.hook_pos_record = vec(0,0);
        this.retracting = false;
        this.hook_radius = 0.7;
        
        //Level change
        this.current_level = 0;
        this.level_finish_time = 0;

        //Flag variable for showing welcome page
        this.show_welcome_page = true;
        this.welcome_page_exit_time = 0;
        this.record_exit_time = false;
        
        //Score system
        this.total_score = 0;
        



       
        
    }
//=======================================================================================================================


    make_control_panel() {
       
         var counters = new Array(4);
         for(var i = 0; i<4; i++)
         {
             counters[i]=0;
         }
         this.key_triggered_button("Move Left", ["j"], () => {
           if(this.retracting == false)
           {
            for(var i =0; i<4; i++)
            {
                if(i!=0)
                {
                    counters[i] = 0;
                }
            }
            if(counters[0]<10)
            {
                if(this.fish_hook_x - 0.2 >= -9)
                {
                   this.fish_hook_x -= 0.2;
                }
            }
            else
            {
                if(this.fish_hook_x - 0.6 >= -9)
                {
                   this.fish_hook_x -= 0.6;
                }
            }
            counters[0]++;
            
        }
        });

        this.key_triggered_button("Move Right", ["l"], () => {
           if(this.retracting == false)
           {
            for(var i =0; i<4; i++)
            {
                if(i!=1)
                {
                    counters[i] = 0;
                }
            }
            if(counters[1]<10)
            {
                if(this.fish_hook_x + 0.2 <= 9)
                {
                   this.fish_hook_x += 0.2; 
                }
            }
            else
            {
                if(this.fish_hook_x + 0.6 <= 9)
                {
                   this.fish_hook_x += 0.6;
                }
            }
            counters[1]++;
            
        }
        });
        this.key_triggered_button("Move Up", ["i"], () => {
            if(this.retracting == false)
           {
            for(var i =0; i<4; i++)
            {
                if(i!=2)
                {
                    counters[i] = 0;
                }
            }
            if(counters[2]<10)
            {
                if(this.fish_hook_y + 0.2 <= 9)
                {
                   this.fish_hook_y += 0.2; 
                }
            }
            else
            {
                if(this.fish_hook_y + 0.6 <= 9)
                {
                   this.fish_hook_y += 0.6;
                }
            }
            counters[2]++;
            
        }
        });
        this.key_triggered_button("Move Down", ["k"], () => {
            if(this.retracting == false)
           {
            for(var i =0; i<4; i++)
            {
                if(i!=3)
                {
                    counters[i] = 0;
                }
            }
            if(counters[3]<10)
            {
                if(this.fish_hook_y - 0.2 >= -9)
                {
                   this.fish_hook_y -= 0.2;
                }
            }
            else
            {
                if(this.fish_hook_y - 0.6 >= -9)
                {
                   this.fish_hook_y -= 0.6;
                }
            }
            counters[3]++;
            
        }
        });
        this.key_triggered_button("CATCH!", ["t"], () => 
        {
            if(this.retracting==false)
            {
            this.catching = true;
            this.record_catching_time = true;
            }
        });

        this.key_triggered_button("Cheating ON/OFF", ["z"], () => 
        {
            if(this.hook_radius==0.7)
            {
                this.hook_radius = 100;
            }
            else
            {
                this.hook_radius = 0.7;
            }
        });

        this.key_triggered_button("START GAME!", ["b"], () =>
        {
            this.show_welcome_page = false;
        });
      
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);

        }


        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        if(this.show_welcome_page){
            this.camera_position_welcome = Mat4.look_at(vec3(0,-4,50),vec3(0,0,0),vec3(0,1,0));
            program_state.set_camera(this.camera_position_welcome);
        }

        if(!this.show_welcome_page){
           let desired_camera = Mat4.identity().times(Mat4.translation(1,31,15));
           desired_camera = desired_camera.times(Mat4.rotation(Math.PI/40,0,1,0)).times(Mat4.inverse(Mat4.look_at(vec3(0, 10,5), vec3(0, 0, 0), vec3(0, 1, 0))));
           let inverse_desired_camera = Mat4.inverse(desired_camera);
           program_state.set_camera(inverse_desired_camera);
        }


        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];


        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

//=================================================Welcome Page=============================================================
        //Draw Welcome Page
        if(this.show_welcome_page) {
            //Headline
            let string = "Fishing Game";
            this.shapes.text.set_string(string, context.context);
            let text_transform_headline = Mat4.identity();
            text_transform_headline = text_transform_headline.times(Mat4.translation(-12.5, 15, 0));
            text_transform_headline = text_transform_headline.times(Mat4.scale(1.5, 1.5, 1.5));
            this.shapes.text.draw(context, program_state, text_transform_headline, this.materials.text_material);

            //"Press S to start!"
            string = "Press B to start!";
            this.shapes.text.set_string(string, context.context);
            let text_transform_start = Mat4.identity();
            text_transform_start = text_transform_start.times(Mat4.translation(-17, -5, 0));
            text_transform_start = text_transform_start.times(Mat4.scale(1.5, 1.5, 1.5));
            this.shapes.text.draw(context, program_state, text_transform_start, this.materials.text_material);

            string = "    =5pts           =10 pts";
            this.shapes.text.set_string(string, context.context);
            let text_transform_guide = Mat4.identity();
            text_transform_guide= text_transform_guide.times(Mat4.scale(0.6, 1., 1.));
            text_transform_guide =text_transform_guide.times(Mat4.translation(-49, -10, 0));
            this.shapes.text.draw(context, program_state, text_transform_guide, this.materials.text_material);

            string = " =20pts           ????=100 pts";
            this.shapes.text.set_string(string, context.context);
            let text_transform_guide2 = Mat4.identity();
            text_transform_guide2= text_transform_guide2.times(Mat4.scale(0.6, 1., 1.));
            text_transform_guide2 =text_transform_guide2.times(Mat4.translation(5, -10, 0));
            this.shapes.text.draw(context, program_state, text_transform_guide2, this.materials.text_material);

            let showcase_trans1 = text_transform_guide2.times(Mat4.translation(-54,0,0)).times(Mat4.scale(2,2,2)).times(Mat4.rotation(Math.PI/2*t,0,0,1));
            this.shapes.fish1.draw(context, program_state, showcase_trans1, this.materials.show_case_1);
            let showcase_trans2 = text_transform_guide2.times(Mat4.translation(-30,0,0)).times(Mat4.scale(1,1,1)).times(Mat4.rotation(Math.PI/2*t,0,0,1));
            this.shapes.fish2.draw(context, program_state, showcase_trans2, this.materials.showcase_2);
            let showcase_trans3 = text_transform_guide2.times(Mat4.translation(-5,0,0)).times(Mat4.scale(1,1,1)).times(Mat4.rotation(Math.PI/2*t,0,0,1));
            this.shapes.fish3.draw(context, program_state, showcase_trans3, this.materials.showcase_3);
            let showcase_trans4 = text_transform_guide2.times(Mat4.translation(0,10,0)).times(Mat4.scale(150,50,50));
            this.shapes.box_1.draw(context, program_state, showcase_trans4, this.materials.showcase_4);
            return;

        }
           
        if(this.record_exit_time == false && this.show_welcome_page == false)
        {
            this.welcome_page_exit_time = t;
            this.record_exit_time = true;
        }

//=================================================SCENE SETUP (DECORATIONS)=================================================
       //Model transformation for Ground
        let ground_transform = Mat4.identity();
        ground_transform = ground_transform.times(Mat4.rotation(Math.PI/2,1,0,0));
        ground_transform = ground_transform.times(Mat4.scale(20,20,20));
        ground_transform = ground_transform.times(Mat4.translation(0,0,0.5));
        this.shapes.sheet.draw(context, program_state, ground_transform, this.materials.ground_material);
       


         // //Model transformation for Pond
        let pond_transform = Mat4.identity();
        pond_transform = pond_transform.times(Mat4.rotation(Math.PI/2,1,0,0));
        pond_transform = pond_transform.times(Mat4.translation(0,0,-5));
        pond_transform = pond_transform.times(Mat4.scale(10,10,10));
        // this.shapes.sheet.draw(context, program_state, pond_transform, this.materials.pond_material);

        //The Wooden Frame & Surrounding Dirt for the Pond
        let frame_transform = Mat4.identity();
        
        frame_transform = frame_transform.times(Mat4.translation(0,4,0));
        frame_transform = frame_transform.times(Mat4.scale(15,15,15));
        this.shapes.frame.draw(context, program_state, frame_transform, this.materials.frame_material);


        let surrounding1_transform = Mat4.identity();
        surrounding1_transform = surrounding1_transform.times(Mat4.translation(31,-5,0)).times(Mat4.scale(20,10,30));
        this.shapes.box_1.draw(context,program_state, surrounding1_transform, this.materials.ground_material);
        let surrounding2_transform = Mat4.identity().times(Mat4.translation(-31,-5,0)).times(Mat4.scale(20,10,30));
        this.shapes.box_1.draw(context,program_state, surrounding2_transform, this.materials.ground_material);
        let surrounding3_transform = Mat4.identity().times(Mat4.translation(0,-5,31)).times(Mat4.scale(11,10,20));
        this.shapes.box_1.draw(context,program_state, surrounding3_transform, this.materials.ground_material);
        let surrounding4_transform = Mat4.identity().times(Mat4.translation(0,-5,-31)).times(Mat4.scale(11,10,20));
        this.shapes.box_1.draw(context,program_state, surrounding4_transform, this.materials.ground_material);


        //Grass and Decorations
        for(var i = 0; i<20; i++)
        {
          let grass_transform = Mat4.identity().times(Mat4.translation(17+i/3*Math.sin(i),6+Math.cos(i),-10+1.2*i)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(2,2,2));
          this.shapes.plant1.draw(context, program_state, grass_transform,this.materials.grass_material);
        }

         for(var i = 0; i<20; i++)
        {
          let grass_transform = Mat4.identity().times(Mat4.translation(25+i/3*Math.sin(i),6+Math.cos(i),-15+1.2*i)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(2,2,2));
          this.shapes.plant1.draw(context, program_state, grass_transform,this.materials.grass_material);
        }

        for(var i = 0; i<20; i++)
        {
          let grass_transform = Mat4.identity().times(Mat4.translation(-17+i/3*Math.sin(i),6+Math.cos(i),10-1.3*i)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(2,2,2));
          this.shapes.plant1.draw(context, program_state, grass_transform,this.materials.grass_material);
        }

        for(var i = 0; i<20; i++)
        {
          let grass_transform = Mat4.identity().times(Mat4.translation(-25+i/3*Math.sin(i),6+Math.cos(i),10-1.3*i)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(2,2,2));
          this.shapes.plant1.draw(context, program_state, grass_transform,this.materials.grass_material);
        }

        for(var i = 0; i<20; i++)
        {
          let grass_transform = Mat4.identity().times(Mat4.translation(-17+1.3*i,6+Math.cos(i),17+i/4*Math.sin(i))).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(2,2,2));
          this.shapes.plant1.draw(context, program_state, grass_transform,this.materials.grass_material);
        }

        for(var i = 0; i<20; i++)
        {
          let grass_transform = Mat4.identity().times(Mat4.translation(-17+1.3*i,6+Math.cos(i),-17+i/4*Math.sin(i))).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(2,2,2));
          this.shapes.plant1.draw(context, program_state, grass_transform,this.materials.grass_material);
        }


        let crab_transform = Mat4.identity().times(Mat4.translation(15+1.2*Math.sin(t),6,-17+0.4*Math.sin(t))).times(Mat4.scale(2,2,2)).times(Mat4.rotation(-Math.PI/2,1,0,0)).times(Mat4.rotation(-Math.PI/5,0,0,1));
         this.shapes.crab.draw(context, program_state, crab_transform,this.materials.crab_material);
        let frog_transform = Mat4.identity().times(Mat4.translation(15+1.2*Math.sin(t/4),6,17+0.4*Math.sin(t/4))).times(Mat4.scale(2,2,2)).times(Mat4.rotation(-Math.PI/2,1,0,0)).times(Mat4.rotation(+6*Math.PI/5,0,0,1));
        this.shapes.frog.draw(context, program_state, frog_transform,this.materials.frog_material);
        let stone_transform = Mat4.identity().times(Mat4.translation(-18,6,17)).times(Mat4.scale(3,4,3)).times(Mat4.rotation(-Math.PI/2,1,0,0)).times(Mat4.rotation(+6*Math.PI/5,0,0,1));
        this.shapes.stone.draw(context, program_state, stone_transform,this.materials.stone_material);
        let stone_transform2 = Mat4.identity().times(Mat4.translation(-22,6,13)).times(Mat4.scale(2,3,2)).times(Mat4.rotation(-Math.PI/2,1,0,0)).times(Mat4.rotation(+6*Math.PI/5,0,0,1));
        this.shapes.stone.draw(context, program_state, stone_transform2,this.materials.stone_material);
        let stone_transform3 = Mat4.identity().times(Mat4.translation(22,6,0)).times(Mat4.scale(2,3,2)).times(Mat4.rotation(-Math.PI/2,1,0,0)).times(Mat4.rotation(+6*Math.PI/5,0,0,1));
        this.shapes.stone.draw(context, program_state, stone_transform3,this.materials.stone_material);

//=================================================INITIALIZATIONS=================================================
        if(this.random_set==false)
        {
            if(this.current_level<5)
            {
                  this.fish_amount = 3 + this.current_level;
                  this.uncaught_fish_amount = this.fish_amount;
            }
            else
            {
                  if(Math.random(114514*t)>0.4)
                  {
                    this.fish_amount = 7;
                    this.uncaught_fish_amount = 7;
                  }
                  else
                  {
                    this.fish_amount = 8;
                    this.uncaught_fish_amount = 8;
                  }
            }
            for(let i = 0; i<this.fish_amount; i++)
            {
                var num = Math.floor(Math.random(i*i)*6) + 1; 
                num *= Math.round(Math.random(i*i)) ? 1 : -1; //https://stackoverflow.com/questions/13455042/random-number-between-negative-and-positive-value
                this.random_numbers[i] = num;
                var num2= Math.floor(Math.random(i*i)*6) + 1; 
                num2 *= Math.round(Math.random(i*i)) ? 1 : -1; 
                this.random_numbers_y[i] = num2;
                this.catched[i] = false;
            }
            this.random_set = true;
        }

        
        //initialization for each frame
        if(this.record_catching_time == true)
        {
            this.recorded_catching_time = t;
            this.record_catching_time = false;
        }
        if(t - this.recorded_catching_time >= 0.1)
        {
            this.catching= false;
        }

//=================================================FISH MOVEMENTS=================================================
        var hoard = new Array();
      
      
        for(let i = 0; i<this.fish_amount; i++)
        {
            let fish_radius = 1;
            let initial_x = this.random_numbers[i];
            let initial_y = this.random_numbers_y[i];
            var fish_transform ;
            if(this.catched[i]==true)
            {
                if(i!=7)
                {
                   fish_transform = Mat4.identity().times(Mat4.translation(this.hoard_x_coord[i]+0.4*Math.sin(t*Math.PI/0.01),0.3*Math.sin(this.recorded_catching_time)+4*(t-this.recorded_catching_time),this.hoard_y_coord[i]+0.4*Math.sin(t*Math.PI/0.01))).times(Mat4.rotation(0.2*i*Math.sin(Math.PI*t/(i+1)),0,1,0));
                }
                else
                {
                    fish_transform = Mat4.identity().times(Mat4.translation(this.hoard_x_coord[i],0.3*Math.sin(this.recorded_catching_time)+4*(t-this.recorded_catching_time),this.hoard_y_coord[i])).times(Mat4.rotation(0.2*i*Math.sin(Math.PI*t/(i+1)),0,1,0));
                }
            }
            else
            {
                if(i<=2)
                {
                    fish_transform = Mat4.identity().times(Mat4.translation(initial_x + 0.7*initial_y*Math.sin(initial_x*t/(i+1)),0.3*Math.sin(t),initial_y + 0.7*initial_x*Math.cos(initial_y*t/(i+1)))).times(Mat4.rotation(0.2*i*Math.sin(Math.PI*t/(i+1)),0,1,0));
                    this.hoard_x_coord[i] = initial_x + 0.7*initial_y*Math.sin(initial_x*t/(i+1));
                    this.hoard_y_coord[i] = initial_y + 0.7*initial_x*Math.cos(initial_y*t/(i+1));
                } 
                else if(i<=4)
                {
                    fish_transform = Mat4.identity().times(Mat4.translation(initial_x + 0.5*initial_y*Math.sin(initial_x*2.5*i*t/(2*i+1))+Math.sin(t),0.3*Math.sin(t),initial_y + 0.6*initial_x*Math.cos(initial_y*2.5*i*t/(1.8*i+1))+Math.sin(t))).times(Mat4.rotation(0.2*i*Math.sin(Math.PI*i*t/(i+1)),0,1,0));
                    fish_transform = fish_transform.times(Mat4.rotation(-Math.PI/2, 1, 0,0)).times(Mat4.scale(0.7,0.7,0.7));
                    this.hoard_x_coord[i] = initial_x + 0.5*initial_y*Math.sin(initial_x*2.5*i*t/(2*i+1))+Math.sin(t);
                    this.hoard_y_coord[i] = initial_y + 0.6*initial_x*Math.cos(initial_y*2.5*i*t/(1.8*i+1))+Math.sin(t);
                }
                else if(i<=6)
                {
                    fish_transform = Mat4.identity().times(Mat4.translation(initial_x + 0.6*initial_y*Math.sin(initial_x*2.4*i*t/(2*i+1))+1.3*Math.sin(t),0.3*Math.sin(t),initial_y + 0.6*initial_x*Math.cos(initial_y*2.4*i*t/(1.8*i+1))+Math.sin(t))).times(Mat4.rotation(0.2*i*Math.sin(Math.PI*i*t/(i+1)),0,1,0));
                    fish_transform = fish_transform.times(Mat4.rotation(-Math.PI/2, 1, 0,0)).times(Mat4.scale(0.5,0.5,0.5));
                    this.hoard_x_coord[i] = initial_x + 0.6*initial_y*Math.sin(initial_x*2.4*i*t/(2*i+1))+1.3*Math.sin(t);
                    this.hoard_y_coord[i] = initial_y + 0.6*initial_x*Math.cos(initial_y*2.4*i*t/(1.8*i+1))+Math.sin(t);
                }
                else
                {
                    fish_transform = Mat4.identity().times(Mat4.translation(8*Math.cos(t),0,8*Math.sin(t))).times(Mat4.rotation(0.2*i*Math.sin(Math.PI*i*t/(i+1)),0,1,0));
                    fish_transform = fish_transform.times(Mat4.rotation(Math.PI/2, 0,1,0)).times(Mat4.rotation(-Math.PI/2, 1,0,0)).times(Mat4.scale(0.8,0.8,0.8));
                    this.hoard_x_coord[i] = 8*Math.cos(t);
                    this.hoard_y_coord[i] = 8*Math.sin(t);
                }
            }
            if(i<=2)
            {
               let fish_object = new collision_object(fish_transform, fish_radius);
               hoard.push(fish_object);
            }  
            else if(i<=4)
            {
               let fish_object = new collision_object(fish_transform, fish_radius*0.7);
               hoard.push(fish_object);
            }     
            else if(i<=6)
            {
               let fish_object = new collision_object(fish_transform, fish_radius*0.5);
               hoard.push(fish_object);
            }
            else
            {
                let secret_object = new collision_object(fish_transform, fish_radius*0.5);
                hoard.push(secret_object);
            }
        }

        //draw fish
        for(let i = 0; i<this.fish_amount; i++)
        {
            if(this.catched[i]!= true)
            {
               if(i<=2)
               {
                   this.shapes.fish1.draw(context, program_state, hoard[i].get_location_matrix(), this.materials.phong);
               }
               else if(i<=4)
               {
                   this.shapes.fish2.draw(context, program_state, hoard[i].get_location_matrix(), this.materials.fish_2);
               }
               else if(i<=6)
               {
                   this.shapes.fish3.draw(context, program_state, hoard[i].get_location_matrix(), this.materials.fish_3);
               }
               else
               {
                   this.shapes.secret.draw(context, program_state, hoard[i].get_location_matrix(), this.materials.secret);
               }
            }
            else if(this.catched[i]== true && t<=this.catched_time[i]+2 && i != 7)
            {
                this.shapes.fish2.draw(context, program_state, hoard[i].get_location_matrix(), this.materials.frame_material);
            }
            else if(this.catched[i]== true && t<=this.catched_time[i]+2 && i ==7)
            {
                this.shapes.secret.draw(context, program_state, hoard[i].get_location_matrix(), this.materials.secret);
            }
        }


//=================================================FISHING ROD & HOOK=================================================
         var rod_transform;
        if(t-this.recorded_catching_time > 2 || t<=2+this.recorded_exit_time)
        {
           rod_transform = Mat4.identity().times(Mat4.translation(this.fish_hook_x+12,9,-this.fish_hook_y)).times(Mat4.scale(20,10,5));
           this.rod_pos_record.x = this.fish_hook_x+12;
           this.rod_pos_record.y = -this.fish_hook_y;
        }
        else
        {
           rod_transform = Mat4.identity().times(Mat4.translation(this.rod_pos_record.x, 9+(t-this.recorded_catching_time)*4,this.rod_pos_record.y)).times(Mat4.scale(20,10,5));
        }
        this.shapes.fishing_rod.draw(context,program_state, rod_transform, this.materials.frame_material);

        //Construct fish hook
        let fish_hook_radius = this.hook_radius;
        let fish_hook_transform = Mat4.identity();
        if(t-this.recorded_catching_time > 2 ||t<=2+this.recorded_exit_time )
        {
           fish_hook_transform = fish_hook_transform.times(Mat4.translation(this.fish_hook_x,1,-this.fish_hook_y));
           fish_hook_transform = fish_hook_transform.times(Mat4.scale(0.2,0.2,0.2));
           this.hook_pos_record.x = this.fish_hook_x;
           this.hook_pos_record.y = -this.fish_hook_y;
           this.retracting = false;
        }
        else //retracting
        {
           
           fish_hook_transform = fish_hook_transform.times(Mat4.translation(this.hook_pos_record.x,1+(t-this.recorded_catching_time)*4,this.hook_pos_record.y));
           fish_hook_transform = fish_hook_transform.times(Mat4.scale(0.2,0.2,0.2));
           this.retracting = true;
        }
        let fish_hook_object = new collision_object(fish_hook_transform, fish_hook_radius);



 //=================================================HOOK COLLISION DETECTION=================================================
        let if_hook_collides_any_fish = false;

        for(let i = 0; i < this.fish_amount; i++)
        {
            if(hoard[i].if_collision(fish_hook_object)&&this.catched[i]!=true)
            {
                if_hook_collides_any_fish = true;//catching detection
                if(this.catching == true)
                {
                    this.uncaught_fish_amount -= 1;
                    if(this.uncaught_fish_amount==0) //<<<<===========================================reset hoard!!!
                    {
                        this.random_set = false;
                        this.level_finish_time = t;
                        this.current_level += 1;
                    }
                    this.catched[i] = true;
                    this.catched_time[i]=t;
                    switch(i)
                    {
                       case 0:
                       case 1:
                       case 2:
                         this.total_score += 5;
                         break;
                       case 3:
                       case 4:
                         this.total_score += 10;
                         break;
                       case 5:
                       case 6:
                         this.total_score += 20;
                         break;
                       case 7:
                         this.total_score += 100;
                         break;
                      
                }
                console.log(this.total_score);
                }
                
            }

        }

        //If fish_hook detects collision of fish and hook, it switches color to red
        let fish_hook_color = color(0,1,0,1); // Green
        if(if_hook_collides_any_fish)
        {
            fish_hook_color = color(1,0,0,1); //Red
        }

        this.shapes.fish_hook.draw(context, program_state, fish_hook_object.get_location_matrix(),
                                            this.materials.fish_hook_material.override({color: fish_hook_color}));

        //Draw Pond
        this.shapes.sheet.draw(context, program_state, pond_transform, this.materials.pond_material);
        
//=================================================LEVEL CLEAR!=================================================
        if(t-this.level_finish_time <= 2 && t>2)
        {
            let d_t = t-this.level_finish_time;
            let level_clear_transform = Mat4.identity().times(Mat4.scale(2,2,2)).times(Mat4.translation(-3,11+d_t*2,5.4+d_t*1).times(Mat4.rotation(-Math.PI/4,1,0,0)));
            this.shapes.level_clear.draw(context,program_state, level_clear_transform, this.materials.level_clear);
        }

    }

}
const Main_Scene = Final_Project;
const Additional_Scenes = [];


export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }