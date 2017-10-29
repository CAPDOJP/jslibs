/*
*--------------------------------------------------------------------
* jQuery-Plugin "ganttchart -config.js-"
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
		colortable:null,
		grouptable:null,
		fields:null,
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
	var VIEW_NAME=['稼働表'];
	var functions={
		reloadcolors:function(callback){
			var fields=vars.fields[$('select#color').val()];
			var options=[fields.options.length];
			$.each(fields.options,function(key,values){
				options[values.index]=values.label;
			});
			/* clear rows */
			vars.colortable.clearrows();
			for (var i=0;i<options.length;i++)
			{
				vars.colortable.addrow();
				vars.colortable.rows.last().find('input#colorkey').val(options[i]);
				vars.colortable.rows.last().find('span.colorkey').text(options[i]);
			}
			vars.colortable.container.show();
			if (callback) callback();
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		vars.fields=resp.properties;
		$.each(resp.properties,function(key,values){
			/* check field type */
			switch (values.type)
			{
				case 'CALC':
				case 'CREATOR':
				case 'DATE':
				case 'DATETIME':
				case 'DROP_DOWN':
				case 'LINK':
				case 'MODIFIER':
				case 'NUMBER':
				case 'RADIO_BUTTON':
				case 'RECORD_NUMBER':
				case 'SINGLE_LINE_TEXT':
				case 'TIME':
					$('select#display').append($('<option>').attr('value',values.code).text(values.label));
					if (!values.lookup) $('select#group').append($('<option>').attr('value',values.code).text(values.label));
					switch (values.type)
					{
						case 'CALC':
							$('select#todate').append($('<option>').attr('value',values.code).text(values.label));
							break;
						case 'DATE':
							$('select#fromdate').append($('<option>').attr('value',values.code).text(values.label));
							break;
						case 'DROP_DOWN':
							$('select#color').append($('<option>').attr('value',values.code).text(values.label));
							break;
						case 'NUMBER':
							$('select#months').append($('<option>').attr('value',values.code).text(values.label));
							break;
						case 'RADIO_BUTTON':
							$('select#color').append($('<option>').attr('value',values.code).text(values.label));
							break;
					}
					break;
			}
		});
		/* initialize valiable */
		vars.colortable=$('.colors').adjustabletable({
			addcallback:function(row){
				$('input#color',row).val(vars.colors[0].replace('#',''));
				$('span#color',row).colorSelector(vars.colors,$('input#color',row));
			}
		});
		vars.colortable.delrow(vars.colortable.rows.eq(0));
		vars.colortable.container.hide();
		vars.grouptable=$('.groups').adjustabletable({
			add:'img.add',
			del:'img.del'
		});
		var add=false;
		var row=null;
		var colors={};
		var groups=[];
		if (Object.keys(config).length!==0)
		{
			colors=JSON.parse(config['colors']);
			groups=config['group'].split(',');
			$('select#fromdate').val(config['fromdate']);
			$('select#todate').val(config['todate']);
			$('select#months').val(config['months']);
			$('select#display').val(config['display']);
			$('select#color').val(config['color']);
			$('input#scalefixedwidth').val(config['scalefixedwidth']);
			$('input#defaultyears').val(config['defaultyears']);
			if (config['scalefixed']=='1') $('input#scalefixed').prop('checked',true);
			$.each(groups,function(index){
				if (add) vars.grouptable.addrow();
				else add=true;
				row=vars.grouptable.rows.last();
				$('select#group',row).val(groups[index]);
			});
			functions.reloadcolors(function(){
				for (var i=0;i<vars.colortable.rows.length;i++)
				{
					row=vars.colortable.rows.eq(i);
					$('input#color',row).val(colors[$('input#colorkey',row).val()].replace('#',''));
					$('span#color',row).colorSelector(vars.colors,$('input#color',row));
				}
			});
		}
		else $('input#defaultyears').val('3');
		$('select#color').on('change',function(){functions.reloadcolors()});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var key='';
		var row=null;
		var colors={};
		var config=[];
		var groups=[];
		/* check values */
		if ($('select#fromdate').val()=='')
		{
			swal('Error!','開始日付フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#todate').val()=='')
		{
			swal('Error!','終了日付フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#months').val()=='')
		{
			swal('Error!','稼働期間フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#display').val()=='')
		{
			swal('Error!','表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#fromdate').val()==$('select#todate').val())
		{
			swal('Error!','開始日付フィールドと終了日付フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#fromdate').val()==$('select#months').val())
		{
			swal('Error!','開始日付フィールドと稼働期間フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		for (var i=0;i<vars.grouptable.rows.length;i++)
		{
			row=vars.grouptable.rows.eq(i);
			if ($('select#group',row).val().length!=0) groups.push($('select#group',row).val());
		}
		if (groups.length==0)
		{
			swal('Error!','集計フィールドを指定して下さい。','error');
			return;
		}
		if ($('select#color').val()=='')
		{
			swal('Error!','区分色指定フィールドを選択して下さい。','error');
			return;
		}
		for (var i=0;i<vars.colortable.rows.length;i++)
		{
			row=vars.colortable.rows.eq(i);
			if ($('input#color',row).val().length!=0)
				colors[$('input#colorkey',row).val()]=$('input#color',row).val();
		}
		if (Object.keys(colors).length!=vars.colortable.rows.length)
		{
			swal('Error!','区分色を指定して下さい。','error');
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
		if (!$.isNumeric($('input#defaultyears').val()))
		{
			swal('Error!','初期表示期間は数値を入力して下さい。','error');
			return;
		}
		/* setup config */
		config['fromdate']=$('select#fromdate').val();
		config['todate']=$('select#todate').val();
		config['months']=$('select#months').val();
		config['display']=$('select#display').val();
		config['group']=groups.join(',');
		config['color']=$('select#color').val();
		config['colors']=JSON.stringify(colors);
		config['scalefixedwidth']=$('input#scalefixedwidth').val();
		config['defaultyears']=$('input#defaultyears').val();
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
						html:'<div id="ganttchart-container" class="customview-container"></div>',
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
				config['ganttchart']=resp.views[VIEW_NAME[0]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);