using System;
using System.Diagnostics;
using System.Windows.Forms;

namespace CodeReviewLauncher
{
   class Program
   {
      private const string codeReviewPath = @"D:\Projects\DevTools\svn-codereview";
      private const string codeReview = "SVNGUICodeReview.hta";

      [STAThread]
      static void Main(string[] args)
      {
         var task = Clipboard.GetText();
         var psi = new ProcessStartInfo { WorkingDirectory = codeReviewPath, FileName = codeReview, Arguments = task };
         Process.Start(psi);
      }
   }
}
