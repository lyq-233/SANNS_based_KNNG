x = 0.1:0.02:0.5;%x���ϵ����ݣ���һ��ֵ�������ݿ�ʼ���ڶ���ֵ���������������ֵ������ֹ
candiSize = [106.17948717948718,119.21518987341773,122.46341463414635,131.69892473118279,188.18947368421053,209.06185567010309,239.18556701030928,282.31632653061223,359.02,428.97,578.75,634.3838383838383,719.69,839.4141414141415,1037.84,1132.03,1034.3,1481.08,1631.65,1933.8,2153.818181818182]; %��������yֵ
plot(x, candiSize, '-om'); %���ԣ���ɫ�����
axis([0.1,0.5,0,2500])  %ȷ��x����y���ͼ��С
set(gca,'XTick',[0.1:0.04:0.5]) %x�᷶Χ�ͼ��
set(gca,'YTick',[0:250:2500]) %y�᷶Χ�ͼ��
legend('��ѡ����ģNr');   %���ϽǱ�ע
xlabel('����W')  %x����������
ylabel('��ѡ����ģNr') %y����������