import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

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
            sheet: new defs.Grid_Patch(10, 10, row_operation, column_operation),
            sheet2: new defs.Grid_Patch(10, 10, row_operation_2, column_operation_2),
            fish1: new Shape_From_File( "assets/19414_Tiger_Shark_v1.obj" ),
        };

        // *** Materials
        this.materials = {
            ground_material: new Material(new defs.Textured_Phong(), {
                ambient: 1., texture: new tiny.Texture("assets/ground_texture.jpeg")
            }),
            pond_material: new Material(new defs.Phong_Shader(), {
                ambient: 0.5, specularity: 0.8, color: color(0,0,1,0.5),
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
        const yellow = hex_color("#fac91a");
        const water_color = color(0,0,0.8,0.1);
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
        this.shapes.sheet.draw(context, program_state, pond_transform, this.materials.pond_material);

        //Fish movement
        if(this.random_set==false)
        {
            for(let i = 0; i<this.fish_amount; i++)
            {
                this.random_numbers[i] =(Math.random(i*i)*59*i*Math.sin(Math.random(i+i)))%10;
            }
            this.random_set = true;
        }

        let fish = Mat4.identity();
        var hoard = new Mat4(this.fish_amount);
        for(let i = 0; i<this.fish_amount; i++)
        {

            hoard[i] = Mat4.identity().times(Mat4.translation(this.random_numbers[i]+5*Math.sin(t/this.random_numbers[i]),this.random_numbers[i]+5*Math.sin(t/2*i),0)).times(Mat4.rotation(-Math.PI/2, 1,0,0));
        }

        for(let i = 1; i<this.fish_amount; i++)
        {
            this.shapes.fish1.draw(context, program_state, hoard[i], this.materials.phong);
        }


    }
}
