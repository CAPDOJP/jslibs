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
(function($){
/*
*--------------------------------------------------------------------
* parameters
* apiikey	:google api key
* -------------------------------------------------------------------
*/
var RouteMap=function(options){
	var options=$.extend({
		apiikey:'',
		container:null,
		isfullscreen:true,
		needroute:true,
		loadedcallback:null,
		isreload:false
	},options);
	/* valiable */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box',
		'position':'relative'
	});
	/* keep parameters */
	this.isfullscreen=options.isfullscreen;
	this.needroute=options.needroute;
	this.loadedcallback=options.loadedcallback;
	/* loading wait */
	var waitgoogle=function(callback){
		setTimeout(function(){
			if (typeof(google)=='undefined') waitgoogle(callback);
			else callback();
		},1000);
	};
	/* append elements */
	this.container=div.clone(true).css({
		'background-color':'#FFFFFF',
		'height':'100%',
		'width':'100%'
	}).attr('id','mapcontainer');
	if (this.isfullscreen)
	{
		this.container.css({
			'bottom':'-100%',
			'left':'0px',
			'position':'fixed',
			'z-index':'999999'
		});
	}
	this.contents=div.clone(true).css({
		'height':'100%',
		'left':'0px',
		'position':'absolute',
		'top':'0px',
		'width':'100%',
		'z-index':'1'
	}).attr('id','mapcontents');
	this.buttonblock=div.clone(true).css({
		'background-color':'transparent',
		'left':'0px',
		'padding':'5px',
		'position':'absolute',
		'text-align':'right',
		'top':'0px',
		'width':'100%',
		'z-index':'2'
	}).append(
		$('<button id="mapclose">')
		.css({
			'background-color':'transparent',
			'border':'none',
			'height':'48px',
			'width':'48px'
		})
		.on('click',function(){
			my.container.css({'bottom':'-100%'});
		})
		.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.svg" alt="閉じる" title="閉じる" />').css({'width':'100%'}))
	);
	this.container.append(this.contents);
	if (this.isfullscreen) this.container.append(this.buttonblock);
	if (options.container!=null) options.container.append(this.container);
	/* setup google map */
	if (!options.isreload)
	{
		var api=$('<script>');
		api.attr('type','text/javascript');
		api.attr('src','https://maps.googleapis.com/maps/api/js?key='+options.apiikey);
		$('head').append(api);
	}
	/* setup map */
	this.colors=$.markercolors();
	this.markers=[];
	this.balloons=[];
	this.map=null;
	this.directionsRenderer=null;
	this.directionsService=null;
	/* loading wait */
	if (options.container!=null) waitgoogle(function(){
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
		my.map=new google.maps.Map(document.getElementById(my.contents.attr('id')),param);
		my.directionsRenderer=new google.maps.DirectionsRenderer({suppressMarkers:true});
		my.directionsService=new google.maps.DirectionsService();
		if (my.loadedcallback!=null) my.loadedcallback();
	});
};
RouteMap.prototype={
	/* close information widnow */
	closeinfowindow:function(){
		var my=this;
		$.each(this.balloons,function(index){
			my.balloons[index].close();
		});
	},
	/* get currentlocation */
	currentlocation:function(options){
		var options=$.extend({
			callback:null
		},options);
		if (navigator.geolocation)
		{
			var userAgent=window.navigator.userAgent.toLowerCase();
			if (userAgent.indexOf('msie')!=-1 || userAgent.indexOf('trident')!=-1) alert('Internet Explorerでは正常に動作しません。\nMicrosoft Edgeかその他のブラウザを利用して下さい。');
			navigator.geolocation.getCurrentPosition(
				function(pos){
					if (options.callback!=null) options.callback(new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude));
				},
				function(error){
					alert('位置情報の取得に失敗しました。\n'+error.message);
				},
				{
					enableHighAccuracy:true,
					maximumAge:0,
					timeout:10000
				}
			);
		}
		else {alert('お使いのブラウザでは位置情報が取得出来ません。');}
	},
	/* open information widnow */
	openinfowindow:function(){
		var my=this;
		$.each(this.balloons,function(index){
			if (my.markers.length>index) my.balloons[index].open(my.map,my.markers[index]);
		});
	},
	/* reload map */
	reloadmap:function(options){
		var options=$.extend({
			markers:[],
			markerfontsize:null,
			isextensionindex:false,
			isopeninfowindow:true,
			callback:null
		},options);
		var colors=this.colors;
		var map=this.map;
		var renderer=this.directionsRenderer;
		var service=this.directionsService;
		var serialnumber=0;
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
		var addmarker=function(latlng,markerindex,colorsindex,label){
			/* append markers */
			var marker=null;
			if (options.markerfontsize!=null)
			{
				marker=new google.maps.Marker({
					map:map,
					position:latlng,
					icon:'https://chart.googleapis.com/chart?chst=d_map_spin&chld=0.55|0|'+colors[colorsindex].back+'|'+options.markerfontsize.toString()+'|_|'+markerindex.toString()
				});
			}
			else
			{
				marker=new google.maps.Marker({
					map:map,
					position:latlng,
					icon:'https://chart.googleapis.com/chart?chst=d_map_pin_letter_withshadow&chld='+markerindex.toString()+'|'+colors[colorsindex].back+'|'+colors[colorsindex].fore
				});
			}
			markers.push(marker);
			/* append balloons */
			if (label.length!=0)
			{
				var balloon=new google.maps.InfoWindow({content:label,disableAutoPan:true});
				if (options.isopeninfowindow) balloon.open(map,marker);
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
				var values=$.extend({
					colors:0,
					label:'',
					lat:0,
					lng:0,
					serialnumber:true,
					extensionindex:''
				},options.markers[0]);
				if (options.isextensionindex) addmarker(new google.maps.LatLng(values.lat,values.lng),values.extensionindex,values.colors,values.label);
				else addmarker(new google.maps.LatLng(values.lat,values.lng),((values.serialnumber)?'1':''),values.colors,values.label);
				/* setup center position */
				map.setCenter(latlng);
				if (options.callback!=null) options.callback();
				break;
			default:
				if (this.needroute)
				{
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
						travelMode:google.maps.TravelMode.DRIVING
					},
					function(result,status){
						if (status==google.maps.DirectionsStatus.OK)
						{
							/* append markers */
							serialnumber=0;
							$.each(options.markers,function(index,values){
								var values=$.extend({
									colors:0,
									label:'',
									lat:0,
									lng:0,
									serialnumber:true,
									extensionindex:''
								},values);
								if (values.serialnumber) serialnumber++;
								if (options.isextensionindex) addmarker(new google.maps.LatLng(values.lat,values.lng),values.extensionindex,values.colors,values.label);
								else addmarker(new google.maps.LatLng(values.lat,values.lng),((values.serialnumber)?serialnumber.toString():''),values.colors,values.label);
							});
							renderer.setDirections(result);
							renderer.setMap(map);
							if (options.callback!=null) options.callback();
						}
					});
				}
				else
				{
					/* append markers */
					serialnumber=0;
					$.each(options.markers,function(index,values){
						var values=$.extend({
							colors:0,
							label:'',
							lat:0,
							lng:0,
							serialnumber:true,
							extensionindex:''
						},values);
						if (values.serialnumber) serialnumber++;
						if (options.isextensionindex) addmarker(new google.maps.LatLng(values.lat,values.lng),values.extensionindex,values.colors,values.label);
						else addmarker(new google.maps.LatLng(values.lat,values.lng),((values.serialnumber)?serialnumber.toString():''),values.colors,values.label);
					});
					/* setup center position */
					map.setCenter(new google.maps.LatLng(options.markers[0].lat,options.markers[0].lng));
					if (options.callback!=null) options.callback();
				}
				break;
		}
		if (this.isfullscreen) this.container.css({'bottom':'0px'});
	}
};
jQuery.extend({
	markercolors:function(){
		return [
			{
				name:'赤',
				back:'FA8273',
				fore:'000000'
			},
			{
				name:'黄',
				back:'FFF07D',
				fore:'000000'
			},
			{
				name:'緑',
				back:'7DC87D',
				fore:'000000'
			},
			{
				name:'紫',
				back:'827DB9',
				fore:'ffffff'
			},
			{
				name:'ピンク',
				back:'E16EA5',
				fore:'000000'
			},
			{
				name:'サーモン',
				back:'FA7382',
				fore:'000000'
			},
			{
				name:'青',
				back:'69B4C8',
				fore:'ffffff'
			},
			{
				name:'茶',
				back:'FFB46E',
				fore:'000000'
			},
			{
				name:'黄緑',
				back:'B4DC69',
				fore:'000000'
			},
			{
				name:'ターコイズ',
				back:'64C3AF',
				fore:'000000'
			},
			{
				name:'薄青',
				back:'87ceeb',
				fore:'000000'
			},
			{
				name:'ラベンダー',
				back:'B473B4',
				fore:'000000'
			}
		];
	}
});
jQuery.fn.routemap=function(apiikey,isfullscreen,needroute,loadedcallback,isreload){
	return new RouteMap({
		apiikey:apiikey,
		container:this,
		isfullscreen:(isfullscreen===undefined)?true:isfullscreen,
		needroute:(needroute===undefined)?true:needroute,
		loadedcallback:(loadedcallback===undefined)?null:loadedcallback,
		isreload:(isreload===undefined)?false:isreload
	});
};
})(jQuery);
