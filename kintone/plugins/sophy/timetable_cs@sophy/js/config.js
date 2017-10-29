/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable -config.js-"
* Version: 3.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		offset:0,
		coursetable:null,
		tooltiptable:null,
		colors:[
			'#FA8273',
			'#FFF07D',
			'#7DC87D',
			'#69B4C8',
			'#827DB9',
			'#E16EA5',
			'#FA7382',
			'#FFB46E',
			'#B4DC69',
			'#64C3AF',
			'#69A0C8',
			'#B473B4'
		]
	};
	var VIEW_NAME=['日次タイムテーブル','月次予定表'];
	var functions={
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId())
					{
						$('select#coursekey').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#grade').append($('<option>').attr('value',values.appId).text(values.name));
						$('select#student').append($('<option>').attr('value',values.appId).text(values.name));
					}
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	functions.loadapps(function(){
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			$.each(resp.properties,function(key,values){
				/* check field type */
				switch (values.type)
				{
					case 'SINGLE_LINE_TEXT':
						$('select#tooltip').append($('<option>').attr('value',values.code).text(values.label));
						break;
				}
			});
			/* initialize valiable */
			vars.coursetable=$('.courses').adjustabletable();
			vars.tooltiptable=$('.tooltips').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var row=null;
			var courses=[];
			var coursekeys=[];
			var tooltips=[];
			var coursenames=$.coursenames();
			for (var i=0;i<coursenames.length;i++)
			{
				if (i!=0) vars.coursetable.addrow();
				row=vars.coursetable.rows.last();
				$('span.coursename',row).text(coursenames[i]);
			}
			if (Object.keys(config).length!==0)
			{
				courses=JSON.parse(config['course']);
				tooltips=config['tooltip'].split(',');
				$('select#grade').val(config['grade']);
				$('select#student').val(config['student']);
				$('select#scale').val(config['scale']);
				$('select#starthour').val(config['starthour']);
				$('select#endhour').val(config['endhour']);
				$('input#scalefixedwidth').val(config['scalefixedwidth']);
				if (config['scalefixed']=='1') $('input#scalefixed').prop('checked',true);
				coursekeys=Object.keys(courses);
				for (var i=0;i<coursekeys.length;i++)
				{
					row=vars.coursetable.rows.eq(i);
					if (row)
					{
						$('select#coursekey',row).val(coursekeys[i]);
						$('input#color',row).val(courses[coursekeys[i]].color);
					}
				}
				$.each(tooltips,function(index){
					if (add) vars.tooltiptable.addrow();
					else add=true;
					row=vars.tooltiptable.rows.last();
					$('select#tooltip',row).val(tooltips[index]);
				});
			}
			$.each($('span#color'),function(index){
				var input=$(this).closest('tr').find('input#color');
				if (!input.val()) input.val(vars.colors[0].replace('#',''));
				if (input.val().length==0) input.val(vars.colors[0].replace('#',''));
				$(this).colorSelector(vars.colors,input);
			});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var row=null;
		var config=[];
		var courses={};
		var tooltips=[];
		/* check values */
		for (var i=0;i<vars.tooltiptable.rows.length;i++)
		{
			row=vars.tooltiptable.rows.eq(i);
			if ($('select#tooltip',row).val().length!=0) tooltips.push($('select#tooltip',row).val());
		}
		if (tooltips.length==0)
		{
			swal('Error!','ツールチップフィールドを指定して下さい。','error');
			return;
		}
		if ($('select#grade').val()=='')
		{
			swal('Error!','学年アプリを選択して下さい。','error');
			return;
		}
		if ($('select#student').val()=='')
		{
			swal('Error!','生徒情報アプリを選択して下さい。','error');
			return;
		}
		for (var i=0;i<vars.coursetable.rows.length;i++)
		{
			var row=vars.coursetable.rows.eq(i);
			if ($('select#coursekey',row).val()=='')
			{
				swal('Error!','講座アプリを選択して下さい。','error');
				error=true;
			}
			if ($('input#color',row).val()=='')
			{
				swal('Error!','講座色を選択して下さい。','error');
				error=true;
			}
			courses[$('select#coursekey',row).val().toString()]={color:$('input#color',row).val(),name:row.find('span.coursename').text()};
		}
	    if (error) return;
		if ($('select#scale').val()=='')
		{
			swal('Error!','目盛り間隔を選択して下さい。','error');
			return;
		}
		if ($('input#scalefixed').prop('checked'))
		{
			if ($('input#scalefixedwidth').val()=='')
			{
				swal('Error!','目盛幅を入力して下さい。','error');
				return;
			}
			if (!$.isNumeric($('input#scalefixedwidth').val()))
			{
				swal('Error!','目盛幅は数値を入力して下さい。','error');
				return;
			}
		}
		if ($('select#starthour').val()=='')
		{
			swal('Error!','タイムテーブル設定開始時刻を選択して下さい。','error');
			return;
		}
		if ($('select#endhour').val()=='')
		{
			swal('Error!','タイムテーブル設定終了時刻を選択して下さい。','error');
			return;
		}
		/* setup config */
		config['tooltip']=tooltips.join(',');
		config['grade']=$('select#grade').val();
		config['student']=$('select#student').val();
		config['course']=JSON.stringify(courses);
		config['scale']=$('select#scale').val();
		config['starthour']=$('select#starthour').val();
		config['endhour']=$('select#endhour').val();
		config['scalefixedwidth']=$('input#scalefixedwidth').val();
		config['scalefixed']=($('input#scalefixed').prop('checked'))?'1':'0';
		/* get view lists */
		kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			var req=$.extend(true,{},resp);
			req.app=kintone.app.getId();
			$.each(VIEW_NAME,function(index){
				if (!req.views[VIEW_NAME[index]])
				{
					/* swaps the index */
					$.each(req.views,function(key,values){
						if ($.inArray(key,VIEW_NAME)<0) values.index=Number(values.index)+1;
					})
		   			/* create custom view */
					req.views[VIEW_NAME[index]]={
						type:'CUSTOM',
						name:VIEW_NAME[index],
						html:'<div id="timetable-container" class="customview-container"></div>',
						filterCond:'',
						sort:'',
						pager:false,
						index:index
					};
				}
			});
			/* save viewid */
			kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'PUT',req,function(resp){
				/* setup config */
				config['datetimetable']=resp.views[VIEW_NAME[0]].id;
				config['monthtimetable']=resp.views[VIEW_NAME[1]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);