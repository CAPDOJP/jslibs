/*
*--------------------------------------------------------------------
* jQuery-Plugin "tis-route"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
var RouteMap=function(){
	/* valiable */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box'
	});
	/* loading wait */
    var waitgoogle=function(interval){
        setTimeout(function(){
            alert(typeof google);
            if (typeof google==='undefined') waitgoogle(interval);
        },interval);
    };
    /* append elements */
	this.container=div.clone(true).css({
		'display':'none',
		'height':'100%',
		'left':'0px',
		'position':'fixed',
		'top':'0px',
		'width':'100%',
		'z-index':'999999'
	});
	this.contents=div.clone(true).css({
		'height':'100%',
		'position':'relative',
		'width':'100%',
		'z-index':'888'
	});
	this.buttonblock=div.clone(true).css({
		'background-color':'rgba(0,0,0,0.5)',
		'bottom':'0px',
		'left':'0px',
		'padding':'5px 0px',
		'position':'absolute',
		'text-align':'center',
		'width':'100%',
		'z-index':'999'
	}).append($('<button>').text('閉じる').on('click',function(){
	    my.container.hide();
	}));
	this.container.append(this.contents);
	this.container.append(this.buttonblock);
	$('body').append(this.container);
	/* setup google map */
	var api=$('<script>');
	api.attr('type','text/javascript');
	api.attr('src','https://maps-api-ssl.google.com/maps/api/js?v=3&sensor=false');
	$('head').append(api);
	/* loading wait */
	waitgoogle(1000);
	/* setup map */
	var latlng=new google.maps.LatLng(0,0);
	var param={
		center:latlng,
		mapTypeControl:false,
		overviewMapControl:false,
		panControl:true,
		scaleControl:false,
		streetViewControl:false,
		zoomControl:true,
		zoom:14
	};
	this.markers=[];
	this.balloons=[];
	this.colors=[
		{
			name:'赤',
			back:'dc143c',
			fore:'000000'
		},
		{
			name:'青',
			back:'0000cd',
			fore:'ffffff'
		},
		{
			name:'黄',
			back:'ffff00',
			fore:'000000'
		},
		{
			name:'紫',
			back:'4b0082',
			fore:'ffffff'
		},
		{
			name:'緑',
			back:'008000',
			fore:'000000'
		},
		{
			name:'茶',
			back:'8b4513',
			fore:'000000'
		},
		{
			name:'水色',
			back:'87ceeb',
			fore:'000000'
		},
		{
			name:'黄緑',
			back:'9acd32',
			fore:'000000'
		}
	];
	this.map=new google.maps.Map(this.contents[0],param);
	this.directionsRenderer=new google.maps.DirectionsRenderer({suppressMarkers:true});
	this.directionsService=new google.maps.DirectionsService();
};
RouteMap.prototype={
	/* reload map */
	reloadmap:function(options){
		var options=$.extend({
			markers:this.locations,
			callback:null
		},options);
		var colors=this.colors;
		var map=this.map;
		var renderer=this.directionsRenderer;
		var service=this.directionsService;
		var markers=[];
		var balloons=[];
		/* initialize markers */
		$.each(this.markers,function(index,values){values.setMap(null);});
		this.markers=[];
		markers=this.markers;
		/* initialize balloons */
		$.each(this.balloons,function(index,values){values.setMap(null);});
		this.balloons=[];
		balloons=this.balloons;
		/* initialize renderer */
		renderer.setMap(null);
		var addmarker=function(latlng,childindex,colorsindex,label){
			/* append markers */
			var marker=new google.maps.Marker({
				map:map,
				position:latlng,
				icon:'https://chart.apis.google.com/chart?chst=d_map_pin_letter_withshadow&chld='+childindex.toString()+'|'+colors[colorsindex].back+'|'+colors[colorsindex].fore
			});
			markers.push(marker);
			/* append balloons */
			if (label.length!=0)
			{
				var balloon=new google.maps.InfoWindow({content:label});
				balloon.open(map,marker);
				google.maps.event.addListener(marker,'click',function(event){
					if (!balloon.getMap()) balloon.open(map,marker);
				});
				balloons.push(balloon);
			}
		};
		switch (options.markers.length)
		{
			case 0:
				break;
			case 1:
    			/* append markers */
				var latlng=new google.maps.LatLng(options.markers[0].lat,options.markers[0].lng);
				addmarker(latlng,
					1,
					(('colors' in options.markers[0])?options.markers[0].colors:0),
					(('label' in options.markers[0])?options.markers[0].label:'')
				);
    			/* setup center position */
				map.setCenter(latlng);
				if (options.callback!=null) options.callback();
				break;
			default:
    			/* setup routes */
				var origin=null;
				var destination=null;
				var waypoints=[];
				var labels=[];
				$.each(options.markers,function(index,values){
					var values=$.extend({
						label:'',
						lat:0,
						lng:0
					},values);
					switch (index)
					{
						case 0:
							origin=new google.maps.LatLng(values.lat,values.lng);
							break;
						case options.markers.length-1:
							destination=new google.maps.LatLng(values.lat,values.lng);
							break;
						default:
							waypoints.push({
								location:new google.maps.LatLng(values.lat,values.lng),
								stopover:true
							});
							break;
					}
					labels.push((values.label.length!=0)?values.label:'');
				});
    			/* setup center position */
				map.setCenter(new google.maps.LatLng(options.markers[0].lat,options.markers[0].lng));
    			/* display routes */
				service.route({
					origin:origin,
					destination:destination,
					waypoints:waypoints,
					travelMode:this.travelmode
				},
				function(result,status){
					if (status == google.maps.DirectionsStatus.OK)
					{
						$.each(options.markers,function(index,values){
							var values=$.extend({
								colors:0,
								label:'',
								lat:0,
								lng:0
							},values);
                			/* append markers */
							addmarker(new google.maps.LatLng(values.lat,values.lng),index+1,values.colors,values.label);
						});
						renderer.setDirections(result);
						renderer.setMap(map);
						if (options.callback!=null) options.callback();
					}
				});
				break;
		}
		this.container.show();
	}
};