/*
*--------------------------------------------------------------------
* jQuery-Plugin "lookupreferer"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		fields:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	var functions={
		setupbutton:function(field){
			$.each($('body').fields(field),function(index){
				var parent=$(this).closest('div');
				var target=$(this);
				var rects={
					parent:parent[0].getBoundingClientRect(),
					target:target[0].getBoundingClientRect()
				};
				if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
				if ($.data(target[0],'added')) return true;
				target.css({
					'padding-right':target.outerHeight(false).toString()+'px',
					'position':'relative',
					'z-index':'1'
				});
				parent.css({'position':'relative'})
				.append(
					$('<img>').css({
						'background-color':'transparent',
						'border':'none',
						'box-sizing':'border-box',
						'cursor':'pointer',
						'display':'block',
						'height':target.outerHeight(false).toString()+'px',
						'margin':'0px',
						'position':'absolute',
						'right':(rects.parent.right-rects.target.right).toString()+'px',
						'top':((rects.parent.top-rects.target.top)*-1).toString()+'px',
						'width':target.outerHeight(false).toString()+'px',
						'z-index':'2'
					})
					.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA5FJREFUeNpiYKAJ6J8y8T+MzYIm4YCumAWNX0+M8fOR+YzY7AWBwpx8RqIcDBBAVPQvMmBC9jfM7zDXs6D7GSgRD6QSgDgRw1isQQoVfEC0QwECiCLESIyXcQU9EyEF+OKLhRgboGABzGUweRYik1MCUc5G09gP0kiTZAYQQEMUIefFBny5GVugoUeVI1DRAWIzGwuxCvHmVGTbsWCYwQb4/HwAh7MDgNR6KNcQqOYCLmfvx+IaB6SAu4DTz0BJR1xhQGraNsAXVUwEAvQ8ECvikkR39n6gbTB2IpS+P/jSNkAAjeDcjJY0FICUArmGYssdRJX40EIaVKSAcsAHEux0wOchYiyGO54Y11OrBKILYKGSTz4AQ0YQlomR61Tk0o5ki4GgkZDFsJofiOdjKYYYybIY6OIGQq0GbKGCrzHAQkk8AS1LwOJDohq5TBRYKgC11BAaxCS1qgn5uB9oAbZ8XAjKszCLgGoekpqdcFkM8gG+/Avy7QWkbsoBAupHAQNAAI2iUUD3FogDBWZ+wFYbEVuA7KfA4gPIvQhyi0xSSyOiQ4qFQHXoSIqtw6PpA/TFe2ilgA8kAkNnAVUtRmpL0d3HBBv3OLq37/E5mpg4Xg/NXjgxtA8NT5DQRCYAjSaSCpD/pDZl8KTsD9h8TkxQOxCRPycADf+AIzsVktvKjCeiA7cBaOl5UlI7Mak6kcyCA28Wo7gAIcdSii0m11JKG/TYxisToX1qmpbV86GFBCPaUE8/PSoJATTL51OlyMQxWAerLsH9XujgPygrGVCzrMZWcByAdbyRRtSoVkkQ0wBYSKCTPgpGOAAIsFE0CkbBKBj6oxA42gMNDMSsYaANOEBqN33QdckH7VAAHuBIypwQlXoJozFMzxhGGeZgIDwgRAwIBKaaDYPewwyQaXwDCs0gash1UHgYNNrCQMc5H9CAG9DOB8MhSYMmxyfg6hQiTwlDZ/0cSU0V1IphQRpFJnjsBjozjD7AAArg86R6fNCW0tCRFHto9ZSARynM4wH0TNLUqjMbQesA0FYzEJUK6J2kGakUcPNJCDyS5z2oWS1R7FFaxeig8jA9PTqoYpgeHh3QUho09AytuydC8/8CHB6FraLZP2Q9DK0+HJCqE3SPI3sUVIDNp6b9AxHDsGmRD1APFkLZsGk0BVp4lO4jHshVF3TyGRTT9kixTZcRDxY6JuX/DKNgFIyCUTAKSAMAXgqXI1UL6+kAAAAASUVORK5CYII=')
					.on('click',function(){
						var body={
							app:vars.fieldinfos[field].lookup.relatedApp.app,
							query:vars.fieldinfos[field].lookup.relatedKeyField+'="'+target.val()+'"'
						};
						if (target.val().length!=0)
						{
							kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:body.app},function(resp){
								var fieldinfos=$.fieldparallelize(resp.properties);
								fieldinfos[vars.fieldinfos[field].lookup.relatedKeyField]['value']=target.val();
								body.query=vars.fieldinfos[field].lookup.relatedKeyField+$.fieldquery(fieldinfos[vars.fieldinfos[field].lookup.relatedKeyField]);
								kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
									if (resp.records.length!=0) window.open('https://'+$(location).attr('host')+'/k/'+body.app+'/show#record='+resp.records[0]['$id'].value.toString()+'&mode=edit');
								},function(error){
									swal('Error!',error.message,'error');
								});
							},function(error){
								swal('Error!',error.message,'error');
							});
						}
						else window.open('https://'+$(location).attr('host')+'/k/'+body.app+'/edit');
					})
				);
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('fields' in vars.config)) return event;
		/* initialize valiable */
		vars.fields=JSON.parse(vars.config['fields']);
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			/* setup buttons */
			for (var i=0;i<vars.fields.length;i++)
			{
				var field=vars.fields[i];
				if (field in vars.fieldinfos)
				{
					functions.setupbutton(field);
					if (vars.fieldinfos[field].tablecode.length!=0)
					{
						var events=[];
						events.push('app.record.create.change.'+vars.fieldinfos[field].tablecode);
						events.push('app.record.edit.change.'+vars.fieldinfos[field].tablecode);
						(function(field,events){
							kintone.events.on(events,function(event){
								functions.setupbutton(field);
								return event;
							});
						})(field,events)
					}
				}
			}
		},function(error){
			swal('Error!',error.message,'error');
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
