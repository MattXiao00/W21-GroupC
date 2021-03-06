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
            frame: new Shape_From_File("assets/frame1.obj"),
            plant1: new Shape_From_File("assets/High Grass.obj"),
            crab: new Shape_From_File("assets/crab.obj"),
            frog: new Shape_From_File("assets/frog.obj"),
            stone: new Shape_From_File("assets/stone1.obj"),
            fish_hook: new defs.Subdivision_Sphere(4),
        };

        // *** Materials

         this.materials = {
            stone_material:new Material(new Textured_Phong(), {
                ambient:0.8 ,specularity:0.1,texture: new Texture("assets/stone.jpg"),//texture: new Texture("assets/crab.jpg")
            }),
            frog_material: new Material(new Textured_Phong(), {
                ambient:0.2 ,specularity:0.5,color: color(0,1,0,1),texture: new Texture("assets/frog.jpg"),//texture: new Texture("assets/crab.jpg")
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
                color: color(1,0,0,1),
            }),
        }

   
         
        


        //Initial_camera_location
        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        //Control of Fish hoard
        this.fish_amount = 5;
        this.random_set = false;
        this.random_numbers = new Array(this.fish_amount);

        //Color of fish hook
        this.fish_hook_color = 0; //0 means green and 1 means red
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


        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];


        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        const water_color = color(0,0,0.8,0.2);
        let model_transform = Mat4.identity();


       //Model transformation for Ground
        let ground_transform = Mat4.identity();
        ground_transform = ground_transform.times(Mat4.rotation(Math.PI/2,1,0,0));
        ground_transform = ground_transform.times(Mat4.scale(20,20,20));
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


        
        //Fish movement
        if(this.random_set==false)
        {
            for(let i = 0; i<this.fish_amount; i++)
            {
                this.random_numbers[i] =(Math.random(i*i)*59*i*Math.sin(Math.random(i+i)))%10;
            }
            this.random_set = true;
        }


        // var hoard = new Mat4(this.fish_amount);
        // for(let i = 0; i<this.fish_amount; i++)
        // {
        //
        //     hoard[i] = Mat4.identity().times(Mat4.translation(this.random_numbers[i]+5*Math.sin(t/this.random_numbers[i]),0,this.random_numbers[i]+5*Math.sin(t/2*i))).times(Mat4.rotation(-Math.PI/2*t/this.random_numbers[i], 1,0,0));
        // }
        //
        // for(let i = 1; i<this.fish_amount; i++)
        // {
        //     this.shapes.fish1.draw(context, program_state, hoard[i], this.materials.phong);
        // }


        var hoard = new Array();
        for(let i = 0; i<this.fish_amount; i++)
        {
            let fish_radius = 1;
            let fish_transform = Mat4.identity().times(Mat4.translation(this.random_numbers[i]+5*Math.sin(t/this.random_numbers[i]),0,this.random_numbers[i]+5*Math.sin(t/2*i))).times(Mat4.rotation(-Math.PI/2*t/this.random_numbers[i], 1,0,0));
            let fish_object = new collision_object(fish_transform, fish_radius);
            hoard.push(fish_object);
        }

        for(let i = 1; i<this.fish_amount; i++)
        {
            this.shapes.fish1.draw(context, program_state, hoard[i].get_location_matrix(), this.materials.phong);
        }

        // // //Construct fish hook
        let fish_hook_radius = 2;
        let fish_hook_transform = Mat4.identity();
        fish_hook_transform = fish_hook_transform.times(Mat4.translation(0,1,0));
        fish_hook_transform = fish_hook_transform.times(Mat4.scale(2,2,2));
        let fish_hook_object = new collision_object(fish_hook_transform, fish_hook_radius);

        //See if any fish collides with fish hook
        let if_hook_collides_any_fish = false;

        // console.log(vec4(0,0,0,1));
        // if(hoard[0].if_collision(fish_hook_object))
        // {
        //     console.log("1");
        // }

        for(let i = 1; i < this.fish_amount; i++)
        {
            if(hoard[i].if_collision(fish_hook_object))
            {
                if_hook_collides_any_fish = true;
                break;
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


    }
}










const Main_Scene = Final_Project;
const Additional_Scenes = [];


export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }
