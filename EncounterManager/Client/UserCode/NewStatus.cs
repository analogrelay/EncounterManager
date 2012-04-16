
namespace LightSwitchApplication
{
    public partial class NewStatus
    {
        partial void NewStatus_InitializeDataWorkspace(global::System.Collections.Generic.List<global::Microsoft.LightSwitch.IDataService> saveChangesTo)
        {
            // Write your code here.
            this.StatusProperty = new Status();
        }

        partial void NewStatus_Saved()
        {
            // Write your code here.
            this.Close(false);
            Application.Current.ShowDefaultScreen(this.StatusProperty);
        }
    }
}